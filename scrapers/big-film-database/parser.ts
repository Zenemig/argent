import { findCol } from "../shared/normalize.js";

export type BigFilmEntry = {
  name: string;
  manufacturer: string;
  dxCode: string;
  country: string;
  availability: number; // 0=unavailable, 1=rare, 2=limited, 3=available
  yearFrom: string;
  yearTo: string;
};

/**
 * Parse the Big Film Database CSV (semicolon-delimited).
 * Header row defines column names.
 */
export function parseBigFilmCsv(csv: string): BigFilmEntry[] {
  const lines = csv.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header (semicolon-delimited)
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  const nameIdx = findCol(headers, ["name", "film_name", "film"]);
  const mfgIdx = findCol(headers, ["manufacturer", "brand", "company"]);
  const dxIdx = findCol(headers, ["dx", "dx_code", "dxcode"]);
  const countryIdx = findCol(headers, ["country", "origin"]);
  const availIdx = findCol(headers, ["availability", "status", "available"]);
  const yearFromIdx = findCol(headers, ["year_from", "from", "start"]);
  const yearToIdx = findCol(headers, ["year_to", "to", "end"]);

  if (nameIdx === -1) return [];

  const entries: BigFilmEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const name = cols[nameIdx]?.trim() ?? "";
    if (!name) continue;

    entries.push({
      name,
      manufacturer: mfgIdx >= 0 ? (cols[mfgIdx]?.trim() ?? "") : "",
      dxCode: dxIdx >= 0 ? (cols[dxIdx]?.trim() ?? "") : "",
      country: countryIdx >= 0 ? (cols[countryIdx]?.trim() ?? "") : "",
      availability: availIdx >= 0 ? parseInt(cols[availIdx]?.trim() ?? "0", 10) || 0 : 0,
      yearFrom: yearFromIdx >= 0 ? (cols[yearFromIdx]?.trim() ?? "") : "",
      yearTo: yearToIdx >= 0 ? (cols[yearToIdx]?.trim() ?? "") : "",
    });
  }

  return entries;
}

function splitCsvLine(line: string): string[] {
  // Handle semicolon-delimited with optional quoting and escaped quotes ("")
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"' && inQuotes) {
      current += '"';
      i++; // Skip the escaped quote
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ";" && !inQuotes) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

