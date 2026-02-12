import type { LensStock } from "./types";
import lensData from "../scrapers/output/lenses.json";

/**
 * Comprehensive lens stock catalog (scraped data).
 * Read-only seed data populated into Dexie `lensStock` table.
 */
export const lensStocks: LensStock[] = lensData as LensStock[];

/** Populate the lensStock table with seed data (idempotent via bulkPut) */
export async function seedLensStocks(
  table: { bulkPut: (items: LensStock[]) => Promise<unknown> },
): Promise<void> {
  await table.bulkPut(lensStocks);
}
