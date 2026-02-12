import * as cheerio from "cheerio";

export type CornellMountRow = {
  name: string;
  type: string; // "bayonet", "breech-lock", "thread", etc.
  registerDistance: number | null; // mm
  mountDiameter: number | null; // mm
};

/**
 * Parse the Cornell mount register distance page.
 * The page has a separate header table followed by a data table.
 * The data table uses a two-column layout:
 *   cols 0-3: left mount (name, type, register, diameter)
 *   col 4: spacer
 *   cols 5-8: right mount (name, type, register, diameter)
 */
export function parseMountTable(html: string): CornellMountRow[] {
  const $ = cheerio.load(html);
  const rows: CornellMountRow[] = [];

  // Find the data table — it has border="1"
  const dataTable = $('table[border="1"]');
  if (dataTable.length === 0) return rows;

  dataTable.find("tr").each((_rowIdx, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 4) return;

    // Left group: cols 0-3 (name, type, register, diameter)
    const leftName = $(cells.eq(0)).text().trim();
    if (leftName && leftName !== "\u00a0") {
      const entry = parseGroup($, cells, 0);
      if (entry) rows.push(entry);
    }

    // Right group: cols 5-8 (if they exist)
    if (cells.length >= 9) {
      const rightName = $(cells.eq(5)).text().trim();
      if (rightName && rightName !== "\u00a0") {
        const entry = parseGroup($, cells, 5);
        if (entry) rows.push(entry);
      }
    }
  });

  return rows;
}

function parseGroup(
  $: cheerio.CheerioAPI,
  cells: cheerio.Cheerio<cheerio.Element>,
  offset: number,
): CornellMountRow | null {
  const name = $(cells.eq(offset)).text().trim();
  if (!name) return null;

  const typeRaw = $(cells.eq(offset + 1)).text().trim().toLowerCase();
  const registerRaw = $(cells.eq(offset + 2)).text().trim();
  const diameterRaw = $(cells.eq(offset + 3)).text().trim();

  let type = "other";
  if (typeRaw.includes("bayonet")) type = "bayonet";
  else if (typeRaw.includes("breech")) type = "breech-lock";
  else if (typeRaw.includes("thread") || typeRaw.includes("screw") || typeRaw.includes("tpi")) type = "thread";

  const registerDistance = parseNumber(registerRaw);
  const mountDiameter = parseNumber(diameterRaw);

  return { name, type, registerDistance, mountDiameter };
}

function parseNumber(raw: string): number | null {
  const match = raw.match(/[\d.]+/);
  if (!match) return null;
  const n = parseFloat(match[0]);
  return isNaN(n) ? null : n;
}
