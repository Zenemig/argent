import { db } from "./db";

/**
 * Read a setting from the _syncMeta table.
 * Returns null if the key doesn't exist.
 */
export async function getSetting(key: string): Promise<string | null> {
  const row = await db._syncMeta.get(key);
  return row?.value ?? null;
}

/**
 * Write a setting to the _syncMeta table.
 * Uses put() so it creates or overwrites.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await db._syncMeta.put({ key, value });
}
