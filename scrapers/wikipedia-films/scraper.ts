import { filmStockOutputSchema, type FilmStockOutput, type ScraperResult } from "../shared/schemas.js";
import { writeOutput } from "../shared/write-output.js";
import { fetchFilmPages } from "./fetch.js";
import { parseFilmTables, type RawFilmRow } from "./parser.js";
import { transformFilm } from "./transformer.js";

const SCRAPER_NAME = "wikipedia-films";

export async function scrapeWikipediaFilms(): Promise<ScraperResult<FilmStockOutput>> {
  const stats = { fetched: 0, parsed: 0, validated: 0, failed: 0 };
  const errors: string[] = [];
  const films: FilmStockOutput[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch pages
  console.log("[Wikipedia Films] Fetching pages...");
  const pages = await fetchFilmPages(SCRAPER_NAME);
  stats.fetched = pages.length;

  // 2. Parse tables
  console.log("[Wikipedia Films] Parsing tables...");
  const rows: RawFilmRow[] = [];
  for (const page of pages) {
    rows.push(...parseFilmTables(page.html, page.discontinued));
  }
  stats.parsed = rows.length;
  console.log(`  Found ${rows.length} raw film entries`);

  // 3. Transform + validate
  for (const row of rows) {
    try {
      const transformed = transformFilm(row);
      if (seenIds.has(transformed.id)) continue; // dedupe
      const validated = filmStockOutputSchema.parse(transformed);
      seenIds.add(validated.id);
      films.push(validated);
      stats.validated++;
    } catch (err) {
      stats.failed++;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${row.brand} ${row.name}: ${msg}`);
    }
  }

  // 4. Write output
  const fp = await writeOutput("films.json", films);
  console.log(`[Wikipedia Films] Done: ${stats.validated} films → ${fp}`);
  if (stats.failed > 0) console.log(`  ${stats.failed} entries failed validation`);

  return { success: true, data: films, errors, stats };
}
