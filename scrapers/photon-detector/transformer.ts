import { normalizeBrand, matchKey, fuzzyNameMatch } from "../shared/normalize.js";
import type { FilmStockOutput } from "../shared/schemas.js";
import type { EdgeCodeEntry } from "./parser.js";

type MergeResult = {
  films: FilmStockOutput[];
  matched: number;
};

/**
 * Match Photon Detector edge/notch codes to existing film entries by brand + name.
 * Uses fuzzy matching to handle slight name differences.
 */
export function mergeEdgeCodes(
  films: FilmStockOutput[],
  entries: EdgeCodeEntry[],
): MergeResult {
  let matched = 0;

  // Build lookup by normalized "brand|name" key
  const entryMap = new Map<string, EdgeCodeEntry>();
  for (const e of entries) {
    const key = matchKey(normalizeBrand(e.brand), e.name);
    entryMap.set(key, e);
  }

  // Merge into films
  for (const film of films) {
    const key = matchKey(film.brand, film.name);
    const entry = entryMap.get(key);

    if (entry) {
      if (entry.edgeCode) film.edge_code = entry.edgeCode;
      if (entry.notchCode) film.notch_code = entry.notchCode;
      matched++;
      continue;
    }

    // Try fuzzy match: brand matches, name is a substring
    for (const [, e] of entryMap) {
      if (normalizeBrand(e.brand) === film.brand && fuzzyNameMatch(film.name, e.name)) {
        if (e.edgeCode) film.edge_code = e.edgeCode;
        if (e.notchCode) film.notch_code = e.notchCode;
        matched++;
        break;
      }
    }
  }

  return { films, matched };
}
