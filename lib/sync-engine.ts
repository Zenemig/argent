import { db } from "./db";
import { SYNCABLE_TABLES, type SyncableTable } from "./constants";
import type { SyncQueueItem } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BATCH_SIZE = 200;
const MAX_RETRIES = 5;
const MAX_BACKOFF_MS = 60_000;
const DOWNLOAD_PAGE_SIZE = 1000;
const DEFAULT_TIMEOUT_MS = 30_000;

/** Fields that should not be sent to Supabase (local-only blobs). */
const LOCAL_ONLY_FIELDS: Record<SyncableTable, string[]> = {
  cameras: [],
  lenses: [],
  films: [],
  rolls: [],
  frames: ["thumbnail", "deleted_at"],
};

/** Timestamp fields that store epoch-ms locally but need ISO strings for Postgres. */
const TIMESTAMP_FIELDS = [
  "created_at",
  "updated_at",
  "deleted_at",
  "start_date",
  "finish_date",
  "develop_date",
  "scan_date",
  "captured_at",
];

/**
 * Compute exponential backoff delay: min(1000 * 2^retryCount, 60000)
 */
export function backoffDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), MAX_BACKOFF_MS);
}

/**
 * Convert epoch-ms timestamps to ISO strings for Postgres.
 * Returns a new object — does not mutate the original.
 */
export function convertTimestamps(
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...entity };
  for (const field of TIMESTAMP_FIELDS) {
    const val = result[field];
    if (typeof val === "number") {
      result[field] = new Date(val).toISOString();
    }
  }
  return result;
}

/**
 * Strip local-only fields from an entity before upload.
 */
export function stripLocalFields(
  table: SyncableTable,
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const fields = LOCAL_ONLY_FIELDS[table];
  if (fields.length === 0) return entity;

  const result = { ...entity };
  for (const field of fields) {
    delete result[field];
  }
  return result;
}

/**
 * Check whether a queue entry is eligible for retry based on its backoff timer.
 */
function isReadyForRetry(item: SyncQueueItem): boolean {
  if (item.status === "pending") return true;
  if (item.status !== "in_progress") return false;
  if (!item.last_attempt) return true;
  const elapsed = Date.now() - item.last_attempt;
  return elapsed >= backoffDelay(item.retry_count);
}

/**
 * Deduplicate queue entries: for the same (table, entity_id), keep only the
 * entry with the highest id (latest enqueue).
 */
export function deduplicateQueue(
  items: SyncQueueItem[],
): SyncQueueItem[] {
  const map = new Map<string, SyncQueueItem>();
  for (const item of items) {
    const key = `${item.table}:${item.entity_id}`;
    const existing = map.get(key);
    if (!existing || (item.id ?? 0) > (existing.id ?? 0)) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

/**
 * Process the upload sync queue: read pending/retryable entries, batch-upsert
 * to Supabase, and handle success/failure per batch.
 *
 * @returns The number of entities successfully synced.
 */
export async function processUploadQueue(
  supabase: SupabaseClient,
): Promise<number> {
  // 1. Read eligible queue entries
  const allEntries = await db._syncQueue
    .where("status")
    .anyOf("pending", "in_progress")
    .toArray();

  const eligible = allEntries.filter(isReadyForRetry);

  if (eligible.length === 0) {
    // Reset stale in_progress entries that are not yet ready for retry
    // (e.g. from a previous cycle that was interrupted). This prevents
    // items from being stuck in in_progress indefinitely.
    const stale = allEntries.filter(
      (e) => e.status === "in_progress" && e.id !== undefined,
    );
    if (stale.length > 0) {
      await db._syncQueue
        .where("id")
        .anyOf(stale.map((e) => e.id as number))
        .modify({ status: "pending", retry_count: 0 });
    }
    return 0;
  }

  // 2. Deduplicate
  const deduplicated = deduplicateQueue(eligible);

  // 3. Group by table
  const byTable = new Map<SyncableTable, SyncQueueItem[]>();
  for (const item of deduplicated) {
    const list = byTable.get(item.table) ?? [];
    list.push(item);
    byTable.set(item.table, list);
  }

  let totalSynced = 0;

  // 4. Process each table
  for (const [table, items] of byTable) {
    // Process in batches of MAX_BATCH_SIZE
    for (let i = 0; i < items.length; i += MAX_BATCH_SIZE) {
      const batch = items.slice(i, i + MAX_BATCH_SIZE);
      const entityIds = batch.map((item) => item.entity_id);

      // Collect all queue entry IDs for this batch (including duplicates)
      const allQueueIds = allEntries
        .filter(
          (e) =>
            e.table === table &&
            entityIds.includes(e.entity_id) &&
            e.id !== undefined,
        )
        .map((e) => e.id as number);

      // Mark as in_progress
      await db._syncQueue
        .where("id")
        .anyOf(allQueueIds)
        .modify({ status: "in_progress" });

      // Read fresh entity state from Dexie
      const entities: Record<string, unknown>[] = [];
      for (const entityId of entityIds) {
        const entity = await db.table(table).get(entityId);
        if (entity) {
          const stripped = stripLocalFields(
            table,
            entity as Record<string, unknown>,
          );
          const converted = convertTimestamps(stripped);
          entities.push(converted);
        }
      }

      if (entities.length === 0) {
        // Entities were deleted locally — remove queue entries
        await db._syncQueue.where("id").anyOf(allQueueIds).delete();
        continue;
      }

      // Upsert to Supabase (with timeout for iOS resilience)
      // Wrap thenable query builder in a real Promise for withTimeout
      const { error } = await withTimeout(
        Promise.resolve(supabase.from(table).upsert(entities, { onConflict: "id" })),
      ) as { error: { message: string } | null };

      if (!error) {
        // Success: remove all queue entries for these entities
        await db._syncQueue.where("id").anyOf(allQueueIds).delete();
        totalSynced += entities.length;

        // Update last upload sync timestamp
        await db._syncMeta.put({
          key: "lastUploadSync",
          value: new Date().toISOString(),
        });
      } else {
        console.warn(
          `[sync] Upload failed for ${table} (${entityIds.length} entities):`,
          error.message,
        );
        // Failure: increment retry counts
        for (const queueId of allQueueIds) {
          const entry = await db._syncQueue.get(queueId);
          if (!entry) continue;

          const newRetryCount = entry.retry_count + 1;
          if (newRetryCount >= MAX_RETRIES) {
            await db._syncQueue.update(queueId, {
              status: "failed",
              retry_count: newRetryCount,
              last_attempt: Date.now(),
            });
          } else {
            await db._syncQueue.update(queueId, {
              status: "in_progress",
              retry_count: newRetryCount,
              last_attempt: Date.now(),
            });
          }
        }
      }
    }
  }

  return totalSynced;
}

/**
 * Get queue statistics for the sync status indicator.
 */
export async function getQueueStats(): Promise<{
  pending: number;
  failed: number;
}> {
  const pending = await db._syncQueue
    .where("status")
    .anyOf("pending", "in_progress")
    .count();
  const failed = await db._syncQueue
    .where("status")
    .equals("failed")
    .count();
  return { pending, failed };
}

/**
 * Race a promise against a timeout. Rejects with a descriptive error if
 * the promise doesn't settle within `ms` milliseconds.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Reset all failed sync queue entries back to pending so they will be
 * retried on the next sync cycle.
 */
export async function retryFailedEntries(): Promise<void> {
  await db._syncQueue
    .where("status")
    .equals("failed")
    .modify({ status: "pending", retry_count: 0 });
}

/**
 * Permanently delete all failed sync queue entries.
 */
export async function clearFailedEntries(): Promise<void> {
  await db._syncQueue.where("status").equals("failed").delete();
}

/**
 * Get failed entries grouped by table for display in the sync details panel.
 */
export async function getFailedEntrySummary(): Promise<
  Map<SyncableTable, { count: number; entities: { id: string; operation: string }[] }>
> {
  const failed = await db._syncQueue
    .where("status")
    .equals("failed")
    .toArray();

  const map = new Map<
    SyncableTable,
    { count: number; entities: { id: string; operation: string }[] }
  >();

  for (const entry of failed) {
    const existing = map.get(entry.table);
    if (existing) {
      existing.count++;
      existing.entities.push({ id: entry.entity_id, operation: entry.operation });
    } else {
      map.set(entry.table, {
        count: 1,
        entities: [{ id: entry.entity_id, operation: entry.operation }],
      });
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Download Sync
// ---------------------------------------------------------------------------

/**
 * Convert ISO timestamp strings from Postgres to epoch-ms for Dexie.
 * Returns a new object — does not mutate the original.
 */
export function convertTimestampsFromServer(
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...entity };
  for (const field of TIMESTAMP_FIELDS) {
    const val = result[field];
    if (typeof val === "string") {
      result[field] = new Date(val).getTime();
    }
  }
  return result;
}

/**
 * Preserve local-only fields that the server doesn't have.
 * For frames: keep the local thumbnail blob so bulkPut doesn't wipe it.
 */
export function preserveLocalFields(
  table: SyncableTable,
  serverEntity: Record<string, unknown>,
  localEntity: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (table === "frames" && localEntity?.thumbnail) {
    return { ...serverEntity, thumbnail: localEntity.thumbnail };
  }
  return serverEntity;
}

/**
 * Download rows from a single Supabase table, with pagination.
 * If `since` is null, downloads all rows (full resync).
 * If `since` is set, downloads only rows updated after that timestamp.
 */
export async function downloadFromTable(
  supabase: SupabaseClient,
  table: SyncableTable,
  since: string | null,
): Promise<Record<string, unknown>[]> {
  const allRows: Record<string, unknown>[] = [];
  let offset = 0;

  while (true) {
    // Build query: select → filter → order → paginate
    let query = supabase.from(table).select("*");

    if (since) {
      query = query.gt("updated_at", since);
    }

    query = query
      .order("updated_at", { ascending: true })
      .range(offset, offset + DOWNLOAD_PAGE_SIZE - 1);

    const { data, error } = await withTimeout(Promise.resolve(query)) as {
      data: Record<string, unknown>[] | null;
      error: { message: string } | null;
    };

    if (error) {
      throw new Error(
        `Download from ${table} failed: ${error.message}`,
      );
    }

    if (!data || data.length === 0) break;

    allRows.push(...(data as Record<string, unknown>[]));

    if (data.length < DOWNLOAD_PAGE_SIZE) break;
    offset += DOWNLOAD_PAGE_SIZE;
  }

  return allRows;
}

/**
 * Main download sync orchestrator.
 * Downloads updated rows from Supabase, applies LWW conflict resolution
 * (server wins), logs conflicts, and updates the local database.
 *
 * @returns Summary of downloaded entities and conflicts detected.
 */
export async function processDownloadSync(
  supabase: SupabaseClient,
): Promise<{ downloaded: number; conflicts: number }> {
  const meta = await db._syncMeta.get("lastDownloadSync");
  const since = meta?.value ?? null;

  let totalDownloaded = 0;
  let totalConflicts = 0;
  let maxUpdatedAt: string | null = null;

  for (const table of SYNCABLE_TABLES) {
    const rows = await downloadFromTable(supabase, table, since);
    if (rows.length === 0) continue;

    // Track the max updated_at across all tables for the watermark
    for (const row of rows) {
      const rowUpdatedAt = row.updated_at as string;
      if (!maxUpdatedAt || rowUpdatedAt > maxUpdatedAt) {
        maxUpdatedAt = rowUpdatedAt;
      }
    }

    // Convert timestamps and check for conflicts
    const toUpsert: Record<string, unknown>[] = [];

    for (const serverRow of rows) {
      const entityId = serverRow.id as string;
      const converted = convertTimestampsFromServer(serverRow);

      // Check if there's a pending upload queue entry for this entity
      const pendingEntries = await db._syncQueue
        .where("table")
        .equals(table)
        .filter(
          (item) =>
            item.entity_id === entityId &&
            (item.status === "pending" || item.status === "in_progress" || item.status === "failed"),
        )
        .toArray();

      if (pendingEntries.length > 0) {
        // Conflict: local has pending changes, server has newer data
        const localEntity = await db.table(table).get(entityId);

        if (localEntity) {
          await db._syncConflicts.add({
            table,
            entity_id: entityId,
            local_data: localEntity as Record<string, unknown>,
            server_data: converted,
            resolved_by: "server_wins",
            created_at: Date.now(),
          });
          totalConflicts++;
        }

        // Remove stale queue entries (server wins)
        const queueIds = pendingEntries
          .filter((e) => e.id !== undefined)
          .map((e) => e.id as number);
        if (queueIds.length > 0) {
          await db._syncQueue.where("id").anyOf(queueIds).delete();
        }
      }

      // Preserve local-only fields (e.g., thumbnail for frames)
      const localEntity = await db.table(table).get(entityId);
      const merged = preserveLocalFields(
        table,
        converted,
        localEntity as Record<string, unknown> | undefined,
      );

      toUpsert.push(merged);
    }

    if (toUpsert.length > 0) {
      await db.table(table).bulkPut(toUpsert);
      totalDownloaded += toUpsert.length;
    }
  }

  // Update watermark using max updated_at from server (avoids clock skew)
  if (maxUpdatedAt) {
    await db._syncMeta.put({
      key: "lastDownloadSync",
      value: maxUpdatedAt,
    });
  }

  return { downloaded: totalDownloaded, conflicts: totalConflicts };
}
