import type { FilmStock, FilmFormat, FilmProcess } from "./types";

/**
 * Filter film catalog stocks by search text, format, and process.
 * Search is case-insensitive against brand and name.
 * Pass "all" for format/process to skip that filter.
 */
export function filterFilmCatalog(
  stocks: FilmStock[],
  search: string,
  formatFilter: string,
  processFilter: string,
): FilmStock[] {
  return stocks.filter((stock) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !stock.name.toLowerCase().includes(q) &&
        !stock.brand.toLowerCase().includes(q)
      )
        return false;
    }
    if (formatFilter !== "all" && !stock.format.includes(formatFilter as FilmFormat))
      return false;
    if (processFilter !== "all" && stock.process !== processFilter)
      return false;
    return true;
  });
}
