import type { FilmFormat, FilmStock, Film } from "./types";

/**
 * Calculate the Exposure Index (EI) from box speed and push/pull stops.
 * E.g., ISO 400 pushed +1 = EI 800.
 */
export function calculateEi(boxSpeed: number, pushPull: number): number {
  return Math.round(boxSpeed * Math.pow(2, pushPull));
}

/**
 * Filter seed film stocks by format.
 * FilmStock.format is an array of formats (e.g., ["35mm", "120"]).
 */
export function filterStocksByFormat(
  stocks: FilmStock[],
  format: FilmFormat,
): FilmStock[] {
  return stocks.filter((s) => s.format.includes(format));
}

/**
 * Filter user-custom films by format.
 * Film.format is a single format string.
 */
export function filterCustomFilmsByFormat(
  films: Film[],
  format: FilmFormat,
): Film[] {
  return films.filter((f) => f.format === format);
}
