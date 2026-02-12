import { normalizeBrand, parseFormats, normalizeProcess, makeId } from "../shared/normalize.js";
import type { FilmStockOutput } from "../shared/schemas.js";
import type { RawFilmRow } from "./parser.js";

export function transformFilm(row: RawFilmRow): FilmStockOutput {
  const brand = normalizeBrand(row.brand);
  const name = row.name;
  const iso = parseInt(row.iso, 10);

  if (isNaN(iso) || iso <= 0) {
    throw new Error(`Invalid ISO: "${row.iso}"`);
  }

  let formats = parseFormats(row.formats);
  if (formats.length === 0) formats = ["35mm"];

  const process = row.process ? normalizeProcess(row.process) : "other";
  const country = row.country || null;

  return {
    id: makeId(brand, name),
    brand,
    name,
    iso,
    format: formats as FilmStockOutput["format"],
    process: process as FilmStockOutput["process"],
    discontinued: row.discontinued,
    edge_code: null,
    notch_code: null,
    dx_code: null,
    country,
  };
}
