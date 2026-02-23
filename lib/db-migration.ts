import Dexie from "dexie";
import type { ArgentDb } from "./db";
import { SYNCABLE_TABLES } from "./constants";

const LEGACY_DB_NAME = "argent";
const MIGRATION_SENTINEL = "migrated_from_legacy";

/**
 * One-time migration from the shared `argent` database to `argent-${userId}`.
 * Copies all rows where user_id === userId (and frames via roll_id).
 * Also migrates pending _syncQueue entries so queued uploads are not lost.
 * Idempotent via sentinel key in the target database.
 * Deletes the legacy database after successful migration.
 */
export async function migrateFromLegacyDb(
  userId: string,
  targetDb: ArgentDb,
): Promise<{ migrated: boolean; rowCount: number }> {
  const sentinel = await targetDb._syncMeta.get(MIGRATION_SENTINEL);
  if (sentinel) return { migrated: false, rowCount: 0 };

  const exists = await Dexie.exists(LEGACY_DB_NAME);
  if (!exists) {
    await targetDb._syncMeta.put({ key: MIGRATION_SENTINEL, value: "no_legacy_db" });
    return { migrated: false, rowCount: 0 };
  }

  const { ArgentDb: ArgentDbClass } = await import("./db");
  const legacyDb = new ArgentDbClass(LEGACY_DB_NAME);
  let rowCount = 0;

  try {
    await legacyDb.open();

    // Copy user-scoped tables (cameras, lenses, films, rolls)
    for (const table of SYNCABLE_TABLES) {
      if (table === "frames") continue; // frames handled separately (no user_id)
      const rows = await legacyDb
        .table(table)
        .where("user_id")
        .equals(userId)
        .toArray();
      if (rows.length > 0) {
        await targetDb.table(table).bulkPut(rows);
        rowCount += rows.length;
      }
    }

    // Frames: find via user's roll IDs
    const rolls = await legacyDb.rolls
      .where("user_id")
      .equals(userId)
      .toArray();
    const rollIds = rolls.map((r) => r.id);
    if (rollIds.length > 0) {
      const frames = await legacyDb.frames
        .where("roll_id")
        .anyOf(rollIds)
        .toArray();
      if (frames.length > 0) {
        await targetDb.frames.bulkPut(frames);
        rowCount += frames.length;
      }
    }

    // Copy pending/in_progress _syncQueue entries (strip auto-increment id)
    const queueRows = await legacyDb._syncQueue
      .filter(
        (item) => item.status === "pending" || item.status === "in_progress",
      )
      .toArray();
    if (queueRows.length > 0) {
      const requeued = queueRows.map(
        ({ id: _, ...rest }) => ({ ...rest, status: "pending" as const }),
      );
      await targetDb._syncQueue.bulkAdd(requeued);
      rowCount += requeued.length;
    }

    // Copy _syncMeta settings (skip internal sentinel keys)
    const metaRows = await legacyDb._syncMeta.toArray();
    const settingRows = metaRows.filter(
      (r) => r.key !== "seeded" && r.key !== MIGRATION_SENTINEL,
    );
    for (const row of settingRows) {
      const existing = await targetDb._syncMeta.get(row.key);
      if (!existing) {
        await targetDb._syncMeta.put(row);
        rowCount++;
      }
    }

    await targetDb._syncMeta.put({
      key: MIGRATION_SENTINEL,
      value: new Date().toISOString(),
    });

    // Delete legacy database to prevent stale data from being re-imported
    legacyDb.close();
    await Dexie.delete(LEGACY_DB_NAME);

    return { migrated: true, rowCount };
  } catch (err) {
    console.warn("[Argent] Legacy db migration failed:", err);
    // Write sentinel so we don't retry on every page load
    try {
      await targetDb._syncMeta.put({
        key: MIGRATION_SENTINEL,
        value: `error:${String(err)}`,
      });
    } catch {
      // best-effort — if sentinel write fails, accept the situation
    }
    return { migrated: false, rowCount: 0 };
  } finally {
    try { legacyDb.close(); } catch { /* already closed on success path */ }
  }
}
