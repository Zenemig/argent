import type { FilmStockOutput, ScraperResult } from "../shared/schemas.js";
import { readOutput, writeOutput } from "../shared/write-output.js";
import { fetchBigFilmCsv } from "./fetch.js";
import { parseBigFilmCsv } from "./parser.js";
import { mergeBigFilmData } from "./transformer.js";

const SCRAPER_NAME = "big-film-database";

/**
 * Parse the Big Film Database CSV for DX codes, availability status,
 * and rebrand info, then merge into existing films.json.
 */
export async function scrapeBigFilmDatabase(): Promise<ScraperResult<FilmStockOutput>> {
  const stats = { fetched: 0, parsed: 0, validated: 0, failed: 0 };
  const errors: string[] = [];

  // 1. Fetch
  console.log("[Big Film DB] Fetching CSV...");
  const csv = await fetchBigFilmCsv(SCRAPER_NAME);
  stats.fetched = 1;

  // 2. Parse
  console.log("[Big Film DB] Parsing CSV...");
  const entries = parseBigFilmCsv(csv);
  stats.parsed = entries.length;
  console.log(`  Found ${entries.length} film entries`);

  // 3. Load existing films
  const existingFilms = await readOutput<FilmStockOutput[]>("films.json");
  if (!existingFilms) {
    console.log("  [warn] No existing films.json — skipping merge");
    return { success: true, data: [], errors: ["No films.json to merge with"], stats };
  }

  // 4. Merge
  const merged = mergeBigFilmData(existingFilms, entries);
  stats.validated = merged.matched;

  // 5. Write updated films
  const fp = await writeOutput("films.json", merged.films);
  console.log(`[Big Film DB] Done: ${stats.validated} films enriched with DX codes → ${fp}`);

  return { success: true, data: merged.films, errors, stats };
}
