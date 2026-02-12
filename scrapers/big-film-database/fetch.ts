import { cachedFetch } from "../shared/fetch.js";

const CSV_URL =
  "https://raw.githubusercontent.com/dxdatabase/Open-source-film-database/main/film_database.csv";

export async function fetchBigFilmCsv(scraperName: string): Promise<string> {
  return cachedFetch(CSV_URL, scraperName);
}
