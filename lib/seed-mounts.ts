import type { MountStock } from "./types";
import mountData from "../scrapers/output/mounts.json";

/**
 * Comprehensive mount stock catalog (scraped data).
 * Read-only seed data populated into Dexie `mountStock` table.
 */
export const mountStocks: MountStock[] = mountData as MountStock[];

/** Populate the mountStock table with seed data (idempotent via bulkPut) */
export async function seedMountStocks(
  table: { bulkPut: (items: MountStock[]) => Promise<unknown> },
): Promise<void> {
  await table.bulkPut(mountStocks);
}
