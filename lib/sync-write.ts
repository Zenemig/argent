import { db } from "./db";
import type { SyncableTable } from "./constants";

/**
 * Add an entity to a Dexie table and enqueue for sync.
 * For entities with user_id (cameras, lenses, films, rolls), the user_id
 * on the entity is used. For entities without user_id (frames), pass the
 * owning user's ID.
 */
export async function syncAdd<T extends { id: string }>(
  table: SyncableTable,
  entity: T,
): Promise<void> {
  await db.table(table).add(entity);

  await db._syncQueue.add({
    table,
    entity_id: entity.id,
    operation: "create",
    status: "pending",
    retry_count: 0,
    last_attempt: null,
    payload: null,
  });
}

/**
 * Update an entity in a Dexie table and enqueue for sync.
 */
export async function syncUpdate(
  table: SyncableTable,
  id: string,
  changes: Record<string, unknown>,
): Promise<void> {
  await db.table(table).update(id, changes);

  await db._syncQueue.add({
    table,
    entity_id: id,
    operation: "update",
    status: "pending",
    retry_count: 0,
    last_attempt: null,
    payload: null,
  });
}
