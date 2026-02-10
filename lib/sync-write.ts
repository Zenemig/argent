import { db } from "./db";
import { GUEST_USER_ID } from "./guest";
import type { SyncableTable } from "./constants";

/**
 * Add an entity to a Dexie table and enqueue for sync if authenticated.
 * For entities with user_id (cameras, lenses, films, rolls), the user_id
 * on the entity is used to decide whether to queue.
 * For entities without user_id (frames), pass the owning user's ID.
 */
export async function syncAdd<T extends { id: string }>(
  table: SyncableTable,
  entity: T,
  ownerUserId?: string,
): Promise<void> {
  await db.table(table).add(entity);

  const userId =
    ownerUserId ??
    (entity as T & { user_id?: string }).user_id ??
    GUEST_USER_ID;

  if (userId !== GUEST_USER_ID) {
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
}

/**
 * Update an entity in a Dexie table and enqueue for sync if authenticated.
 * Reads the entity's user_id to decide whether to queue.
 * For entities without user_id (frames), pass the owning user's ID.
 */
export async function syncUpdate(
  table: SyncableTable,
  id: string,
  changes: Record<string, unknown>,
  ownerUserId?: string,
): Promise<void> {
  await db.table(table).update(id, changes);

  if (ownerUserId) {
    if (ownerUserId !== GUEST_USER_ID) {
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
    return;
  }

  const entity = await db.table(table).get(id);
  if (entity && entity.user_id !== GUEST_USER_ID) {
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
}
