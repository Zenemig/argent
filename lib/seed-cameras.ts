import type { CameraStock } from "./types";
import cameraData from "../scrapers/output/cameras.json";

/**
 * Comprehensive camera stock catalog (scraped data).
 * Read-only seed data populated into Dexie `cameraStock` table.
 */
export const cameraStocks: CameraStock[] = cameraData as CameraStock[];

/** Populate the cameraStock table with seed data (idempotent via bulkPut) */
export async function seedCameraStocks(
  table: { bulkPut: (items: CameraStock[]) => Promise<unknown> },
): Promise<void> {
  await table.bulkPut(cameraStocks);
}
