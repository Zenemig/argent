import { describe, it, expect } from "vitest";
import { parseFilmTables } from "./parser.js";

const makeTable = (headers: string[], rows: string[][]): string => {
  const ths = headers.map((h) => `<th>${h}</th>`).join("");
  const trs = rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");
  return `<table class="wikitable"><tr>${ths}</tr>${trs}</table>`;
};

describe("parseFilmTables", () => {
  it("extracts rows from a basic table", () => {
    const html = makeTable(
      ["Make", "Name", "ISO", "Formats", "Process"],
      [["Kodak", "Portra 400", "400", "135", "C-41"]],
    );
    const rows = parseFilmTables(html, false);
    expect(rows).toHaveLength(1);
    expect(rows[0].brand).toBe("Kodak");
    expect(rows[0].name).toBe("Portra 400");
    expect(rows[0].iso).toBe("400");
    expect(rows[0].formats).toBe("135");
    expect(rows[0].process).toBe("C-41");
    expect(rows[0].discontinued).toBe(false);
  });

  it("recognizes column aliases", () => {
    const html = makeTable(
      ["Manufacturer", "Film", "Speed", "Size", "Chemistry"],
      [["Fujifilm", "Velvia 50", "50", "120", "E-6"]],
    );
    const rows = parseFilmTables(html, false);
    expect(rows).toHaveLength(1);
    expect(rows[0].brand).toBe("Fujifilm");
    expect(rows[0].name).toBe("Velvia 50");
  });

  it("marks page-level discontinued", () => {
    const html = makeTable(
      ["Make", "Name", "ISO"],
      [["Agfa", "APX 25", "25"]],
    );
    const rows = parseFilmTables(html, true);
    expect(rows[0].discontinued).toBe(true);
  });

  it("detects strikethrough as discontinued", () => {
    const html = makeTable(
      ["Make", "Name", "ISO"],
      [["Kodak", "<s>Technical Pan</s>", "25"]],
    );
    const rows = parseFilmTables(html, false);
    expect(rows[0].discontinued).toBe(true);
  });

  it("detects pink background as discontinued", () => {
    const ths = "<tr><th>Make</th><th>Name</th><th>ISO</th></tr>";
    const row = `<tr style="background:#ffe4e1"><td>Kodak</td><td>Kodachrome 64</td><td>64</td></tr>`;
    const html = `<table class="wikitable">${ths}${row}</table>`;
    const rows = parseFilmTables(html, false);
    expect(rows[0].discontinued).toBe(true);
  });

  it("cleans Wikipedia reference markers from names", () => {
    const html = makeTable(
      ["Make", "Name", "ISO"],
      [["Ilford", "HP5 Plus[12]", "400"]],
    );
    const rows = parseFilmTables(html, false);
    expect(rows[0].name).toBe("HP5 Plus");
  });

  it("extracts first number for ISO", () => {
    const html = makeTable(
      ["Make", "Name", "ISO"],
      [["Kodak", "TMAX", "100/200"]],
    );
    const rows = parseFilmTables(html, false);
    expect(rows[0].iso).toBe("100");
  });

  it("skips rows with missing brand or name", () => {
    const html = makeTable(
      ["Make", "Name", "ISO"],
      [
        ["", "No Brand", "400"],
        ["Kodak", "", "400"],
        ["Kodak", "Valid", "100"],
      ],
    );
    const rows = parseFilmTables(html, false);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Valid");
  });

  it("skips tables without required columns", () => {
    const html = makeTable(
      ["Title", "Description"],
      [["Something", "Not a film table"]],
    );
    const rows = parseFilmTables(html, false);
    expect(rows).toHaveLength(0);
  });

  it("defaults format to 135 when column missing", () => {
    const html = makeTable(
      ["Make", "Name", "ISO"],
      [["Kodak", "Tri-X", "400"]],
    );
    const rows = parseFilmTables(html, false);
    expect(rows[0].formats).toBe("135");
  });
});
