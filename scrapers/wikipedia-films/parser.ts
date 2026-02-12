import * as cheerio from "cheerio";
import { findCol } from "../shared/normalize.js";

export type RawFilmRow = {
  brand: string;
  name: string;
  iso: string;
  formats: string;
  process: string;
  discontinued: boolean;
  country: string;
};

/**
 * Parse wikitables from Wikipedia film list pages.
 * Tables have varying column structures — we identify columns by header text.
 */
export function parseFilmTables(html: string, pageDiscontinued: boolean): RawFilmRow[] {
  const $ = cheerio.load(html);
  const rows: RawFilmRow[] = [];

  $("table.wikitable").each((_tableIdx, table) => {
    // Read header row to identify column indices
    const headers: string[] = [];
    $(table).find("tr:first-child th, thead th").each((_i, th) => {
      headers.push($(th).text().trim().toLowerCase());
    });

    if (headers.length === 0) return;

    // Find relevant columns — Wikipedia tables vary in structure
    const brandIdx = findCol(headers, ["make", "brand", "manufacturer", "company", "maker"]);
    const nameIdx = findCol(headers, ["name", "film", "product", "emulsion"]);
    const isoIdx = findCol(headers, ["iso", "speed", "asa", "ei"]);
    const formatIdx = findCol(headers, ["formats", "format", "size", "sizes"]);
    const processIdx = findCol(headers, ["process", "type", "chemistry", "development"]);
    const countryIdx = findCol(headers, ["origin", "country", "made in"]);

    // Need at least brand + name + ISO
    if (brandIdx === -1 || nameIdx === -1 || isoIdx === -1) return;

    // Track current brand for rows that use rowspan
    let currentBrand = "";

    $(table).find("tbody tr, tr").each((_rowIdx, tr) => {
      const cells = $(tr).find("td");
      if (cells.length === 0) return; // header row

      // Handle rowspan: if fewer cells than headers, brand carries over
      let offset = 0;
      if (cells.length < headers.length && currentBrand) {
        offset = headers.length - cells.length;
      }

      const getBrand = (): string => {
        if (offset > 0 && brandIdx < offset) return currentBrand;
        const cell = cells.eq(brandIdx - offset);
        const text = cell.text().trim();
        if (text) currentBrand = text;
        return currentBrand;
      };

      const getCell = (idx: number): string => {
        if (idx === -1) return "";
        const adjusted = idx - offset;
        if (adjusted < 0 || adjusted >= cells.length) return "";
        return $(cells.eq(adjusted)).text().trim();
      };

      const brand = getBrand();
      const name = getCell(nameIdx);
      const iso = getCell(isoIdx);

      if (!brand || !name || !iso) return;

      // Detect discontinued: strikethrough text OR pink background row
      const nameCell = cells.eq(nameIdx - offset);
      const hasStrikethrough = nameCell.find("s, del, strike").length > 0;
      const rowStyle = $(tr).attr("style") || "";
      const hasPinkBg = rowStyle.includes("ffe4e1") || rowStyle.includes("pink");

      rows.push({
        brand,
        name: cleanName(name),
        iso: cleanIso(iso),
        formats: formatIdx !== -1 ? getCell(formatIdx) : "135",
        process: processIdx !== -1 ? getCell(processIdx) : "",
        discontinued: pageDiscontinued || hasStrikethrough || hasPinkBg,
        country: countryIdx !== -1 ? getCell(countryIdx) : "",
      });
    });
  });

  return rows;
}

function cleanName(raw: string): string {
  return raw.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();
}

function cleanIso(raw: string): string {
  // Extract first number from strings like "400", "100/200", "25-3200"
  const match = raw.match(/\d+/);
  return match ? match[0] : raw;
}
