import { db } from "./db";
import type { SyncableTable } from "./constants";
import type { SyncQueueItem } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BATCH_SIZE = 200;
const MAX_RETRIES = 5;
const MAX_BACKOFF_MS = 60_000;

/** Fields that should not be sent to Supabase (local-only blobs). */
const LOCAL_ONLY_FIELDS: Record<SyncableTable, string[]> = {
  cameras: [],
  lenses: [],
  films: [],
  rolls: [],
  frames: ["thumbnail"],
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
  if (eligible.length === 0) return 0;

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

      // Upsert to Supabase
      const { error } = await supabase
        .from(table)
        .upsert(entities, { onConflict: "id" });

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
