import * as cheerio from "cheerio";
import { findCol } from "../shared/normalize.js";

export type EdgeCodeEntry = {
  brand: string;
  name: string;
  iso: number | null;
  edgeCode: string;
  notchCode: string;
  category: string; // "BW", "C-41", "E-6", etc.
};

/**
 * Parse Photon Detector's film data tables for edge codes and notch codes.
 * The page has multiple tables organized by film category.
 */
export function parseEdgeCodeTables(html: string): EdgeCodeEntry[] {
  const $ = cheerio.load(html);
  const entries: EdgeCodeEntry[] = [];

  // Track current category from headings
  let currentCategory = "";

  $("h2, h3, h4, table").each((_i, elem) => {
    if (elem.type === "tag" && ["h2", "h3", "h4"].includes(elem.tagName)) {
      currentCategory = $(elem).text().trim();
      return;
    }

    if (elem.type !== "tag" || elem.tagName !== "table") return;

    // Read headers
    const headers: string[] = [];
    $(elem).find("tr:first-child td, tr:first-child th, thead th").each((_j, cell) => {
      headers.push($(cell).text().trim().toLowerCase());
    });

    if (headers.length < 2) return;

    const brandIdx = findCol(headers, ["brand", "manufacturer", "company"]);
    const nameIdx = findCol(headers, ["name", "film", "emulsion", "product"]);
    const isoIdx = findCol(headers, ["iso", "speed", "asa"]);
    const edgeIdx = findCol(headers, ["edge", "marking", "code", "edge code", "edge marking"]);
    const notchIdx = findCol(headers, ["notch"]);

    if (nameIdx === -1) return;

    let currentBrand = "";

    $(elem).find("tr").each((_rowIdx, tr) => {
      const cells = $(tr).find("td");
      if (cells.length < 2) return;

      // Handle rowspan (brand column may span multiple rows)
      let offset = 0;
      if (cells.length < headers.length && currentBrand) {
        offset = headers.length - cells.length;
      }

      const getCell = (idx: number): string => {
        if (idx === -1) return "";
        const adj = idx - offset;
        if (adj < 0 || adj >= cells.length) return "";
        return $(cells.eq(adj)).text().trim();
      };

      const brandText = brandIdx >= 0 ? getCell(brandIdx) : "";
      if (brandText) currentBrand = brandText;
      const brand = offset > 0 && brandIdx < offset ? currentBrand : (brandText || currentBrand);

      const name = getCell(nameIdx);
      if (!name) return;

      const isoRaw = getCell(isoIdx);
      const isoMatch = isoRaw.match(/\d+/);
      const iso = isoMatch ? parseInt(isoMatch[0], 10) : null;

      const edgeCode = edgeIdx >= 0 ? getCell(edgeIdx) : "";
      const notchCode = notchIdx >= 0 ? getCell(notchIdx) : "";

      if (!edgeCode && !notchCode) return; // No useful data

      entries.push({
        brand,
        name: name.replace(/\[.*?\]/g, "").trim(),
        iso,
        edgeCode,
        notchCode,
        category: currentCategory,
      });
    });
  });

  return entries;
}

