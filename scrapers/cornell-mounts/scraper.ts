import type { MountStockOutput, ScraperResult } from "../shared/schemas.js";
import { readOutput, writeOutput } from "../shared/write-output.js";
import { fetchCornellPage } from "./fetch.js";
import { parseMountTable } from "./parser.js";
import { mergeMountData } from "./transformer.js";

const SCRAPER_NAME = "cornell-mounts";

/**
 * Scrape Cornell's mount register distance table and merge with
 * existing mounts.json (from Lensfun).
 */
export async function scrapeCornellMounts(): Promise<ScraperResult<MountStockOutput>> {
  const stats = { fetched: 0, parsed: 0, validated: 0, failed: 0 };
  const errors: string[] = [];

  // 1. Fetch
  console.log("[Cornell Mounts] Fetching page...");
  const html = await fetchCornellPage(SCRAPER_NAME);
  stats.fetched = 1;

  // 2. Parse
  console.log("[Cornell Mounts] Parsing mount table...");
  const rows = parseMountTable(html);
  stats.parsed = rows.length;
  console.log(`  Found ${rows.length} mount entries`);

  // 3. Load existing mounts from Lensfun output
  const existingMounts = await readOutput<MountStockOutput[]>("mounts.json");

  // 4. Merge register distances into existing data
  const merged = mergeMountData(existingMounts ?? [], rows);
  stats.validated = merged.length;

  // 5. Write updated mounts
  const fp = await writeOutput("mounts.json", merged);
  console.log(`[Cornell Mounts] Done: ${stats.validated} mounts (enriched with register distances) → ${fp}`);

  return { success: true, data: merged, errors, stats };
}
