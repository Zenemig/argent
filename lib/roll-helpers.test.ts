import { describe, it, expect } from "vitest";
import {
  calculateEi,
  filterStocksByFormat,
  filterCustomFilmsByFormat,
} from "./roll-helpers";
import type { FilmStock, Film } from "./types";

describe("calculateEi", () => {
  it("returns box speed when pushPull is 0", () => {
    expect(calculateEi(400, 0)).toBe(400);
  });

  it("+1 stop doubles the ISO", () => {
    expect(calculateEi(400, 1)).toBe(800);
  });

  it("-1 stop halves the ISO", () => {
    expect(calculateEi(400, -1)).toBe(200);
  });

  it("+2 stops quadruples the ISO", () => {
    expect(calculateEi(100, 2)).toBe(400);
  });

  it("+3 stops = 8x the ISO", () => {
    expect(calculateEi(100, 3)).toBe(800);
  });

  it("-2 stops = 1/4 the ISO", () => {
    expect(calculateEi(400, -2)).toBe(100);
  });

  it("-3 stops = 1/8 the ISO", () => {
    expect(calculateEi(800, -3)).toBe(100);
  });

  it("rounds correctly for non-power-of-2 ISOs", () => {
    // 160 * 2^1 = 320
    expect(calculateEi(160, 1)).toBe(320);
    // 160 * 2^-1 = 80
    expect(calculateEi(160, -1)).toBe(80);
    // 320 * 2^1 = 640
    expect(calculateEi(320, 1)).toBe(640);
  });
});

const makeStock = (
  overrides: Partial<FilmStock> & { id: string; brand: string; name: string },
): FilmStock => ({
  iso: 400,
  format: ["35mm"],
  process: "C-41",
  ...overrides,
});

describe("filterStocksByFormat", () => {
  const stocks: FilmStock[] = [
    makeStock({ id: "a", brand: "Kodak", name: "Portra 400", format: ["35mm", "120"] }),
    makeStock({ id: "b", brand: "Ilford", name: "HP5", format: ["35mm", "120", "4x5"] }),
    makeStock({ id: "c", brand: "Fuji", name: "Velvia 50", format: ["120"] }),
  ];

  it("filters for 35mm", () => {
    const result = filterStocksByFormat(stocks, "35mm");
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("filters for 120", () => {
    const result = filterStocksByFormat(stocks, "120");
    expect(result).toHaveLength(3);
  });

  it("includes multi-format stocks", () => {
    const result = filterStocksByFormat(stocks, "4x5");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("returns empty for unmatched format", () => {
    const result = filterStocksByFormat(stocks, "8x10");
    expect(result).toHaveLength(0);
  });
});

const makeFilm = (
  overrides: Partial<Film> & { id: string; brand: string; name: string },
): Film => ({
  user_id: "test-user",
  iso: 400,
  format: "35mm",
  process: "C-41",
  is_custom: true,
  deleted_at: null,
  updated_at: Date.now(),
  created_at: Date.now(),
  ...overrides,
});

describe("filterCustomFilmsByFormat", () => {
  const films: Film[] = [
    makeFilm({ id: "x", brand: "Custom", name: "Film A", format: "35mm" }),
    makeFilm({ id: "y", brand: "Custom", name: "Film B", format: "120" }),
    makeFilm({ id: "z", brand: "Custom", name: "Film C", format: "35mm" }),
  ];

  it("filters by exact format match", () => {
    const result = filterCustomFilmsByFormat(films, "35mm");
    expect(result).toHaveLength(2);
  });

  it("returns empty when no match", () => {
    const result = filterCustomFilmsByFormat(films, "4x5");
    expect(result).toHaveLength(0);
  });
});
