import { normalizeBrand, matchKey, fuzzyNameMatch } from "../shared/normalize.js";
import type { FilmStockOutput } from "../shared/schemas.js";
import type { BigFilmEntry } from "./parser.js";

type MergeResult = {
  films: FilmStockOutput[];
  matched: number;
};

/**
 * Match Big Film Database entries to existing film stocks by manufacturer + name.
 * Enriches with DX codes, country, and availability (discontinued) status.
 */
export function mergeBigFilmData(
  films: FilmStockOutput[],
  entries: BigFilmEntry[],
): MergeResult {
  let matched = 0;

  // Build lookup by normalized manufacturer|name
  const entryMap = new Map<string, BigFilmEntry>();
  for (const e of entries) {
    const key = matchKey(normalizeBrand(e.manufacturer), e.name);
    entryMap.set(key, e);
  }

  for (const film of films) {
    const key = matchKey(film.brand, film.name);
    const entry = entryMap.get(key);

    if (entry) {
      if (entry.dxCode) film.dx_code = entry.dxCode;
      if (entry.country && !film.country) film.country = entry.country;
      // Availability 0 = discontinued
      if (entry.availability === 0 && !film.discontinued) film.discontinued = true;
      matched++;
      continue;
    }

    // Try fuzzy match
    for (const [, e] of entryMap) {
      if (normalizeBrand(e.manufacturer) === film.brand && fuzzyNameMatch(film.name, e.name)) {
        if (e.dxCode) film.dx_code = e.dxCode;
        if (e.country && !film.country) film.country = e.country;
        if (e.availability === 0 && !film.discontinued) film.discontinued = true;
        matched++;
        break;
      }
    }
  }

  return { films, matched };
}
