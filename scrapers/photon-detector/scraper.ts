import type { FilmStockOutput, ScraperResult } from "../shared/schemas.js";
import { readOutput, writeOutput } from "../shared/write-output.js";
import { fetchPhotonDetectorPage } from "./fetch.js";
import { parseEdgeCodeTables } from "./parser.js";
import { mergeEdgeCodes } from "./transformer.js";

const SCRAPER_NAME = "photon-detector";

/**
 * Scrape Photon Detector for film edge codes and notch codes,
 * then merge into existing films.json.
 */
export async function scrapePhotonDetector(): Promise<ScraperResult<FilmStockOutput>> {
  const stats = { fetched: 0, parsed: 0, validated: 0, failed: 0 };
  const errors: string[] = [];

  // 1. Fetch
  console.log("[Photon Detector] Fetching page...");
  const html = await fetchPhotonDetectorPage(SCRAPER_NAME);
  stats.fetched = 1;

  // 2. Parse
  console.log("[Photon Detector] Parsing edge code tables...");
  const entries = parseEdgeCodeTables(html);
  stats.parsed = entries.length;
  console.log(`  Found ${entries.length} edge code entries`);

  // 3. Load existing films
  const existingFilms = await readOutput<FilmStockOutput[]>("films.json");
  if (!existingFilms) {
    console.log("  [warn] No existing films.json — skipping merge");
    return { success: true, data: [], errors: ["No films.json to merge with"], stats };
  }

  // 4. Merge
  const merged = mergeEdgeCodes(existingFilms, entries);
  stats.validated = merged.matched;

  // 5. Write updated films
  const fp = await writeOutput("films.json", merged.films);
  console.log(`[Photon Detector] Done: ${stats.validated} films enriched with edge/notch codes → ${fp}`);

  return { success: true, data: merged.films, errors, stats };
}
