import type { FilmStock } from "./types";
import filmData from "../scrapers/output/films.json";

/**
 * Comprehensive film stock catalog (~990 stocks from scraped data).
 * Read-only seed data populated into Dexie `filmStock` table.
 */
export const filmStocks: FilmStock[] = filmData as FilmStock[];

/** Populate the filmStock table with seed data (idempotent via bulkPut) */
export async function seedFilmStocks(
  table: { bulkPut: (items: FilmStock[]) => Promise<unknown> },
): Promise<void> {
  await table.bulkPut(filmStocks);
}
