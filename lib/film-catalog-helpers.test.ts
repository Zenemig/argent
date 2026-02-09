import { describe, it, expect } from "vitest";
import { filterFilmCatalog } from "./film-catalog-helpers";
import type { FilmStock } from "./types";

const stocks: FilmStock[] = [
  { id: "1", brand: "Kodak", name: "Portra 400", iso: 400, format: ["35mm", "120"], process: "C-41" },
  { id: "2", brand: "Kodak", name: "Tri-X 400", iso: 400, format: ["35mm", "120"], process: "BW" },
  { id: "3", brand: "Fujifilm", name: "Velvia 50", iso: 50, format: ["35mm", "120", "4x5"], process: "E-6" },
  { id: "4", brand: "Ilford", name: "HP5 Plus", iso: 400, format: ["35mm", "120", "4x5"], process: "BW" },
  { id: "5", brand: "CineStill", name: "800T", iso: 800, format: ["35mm", "120"], process: "C-41" },
];

describe("filterFilmCatalog", () => {
  describe("search", () => {
    it("filters by name (case insensitive)", () => {
      const result = filterFilmCatalog(stocks, "portra", "all", "all");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("filters by brand (case insensitive)", () => {
      const result = filterFilmCatalog(stocks, "kodak", "all", "all");
      expect(result).toHaveLength(2);
    });

    it("empty search returns all", () => {
      const result = filterFilmCatalog(stocks, "", "all", "all");
      expect(result).toHaveLength(5);
    });

    it("no match returns empty", () => {
      const result = filterFilmCatalog(stocks, "nonexistent", "all", "all");
      expect(result).toHaveLength(0);
    });
  });

  describe("format filter", () => {
    it("filters for 35mm", () => {
      const result = filterFilmCatalog(stocks, "", "35mm", "all");
      expect(result).toHaveLength(5);
    });

    it("filters for 4x5", () => {
      const result = filterFilmCatalog(stocks, "", "4x5", "all");
      expect(result).toHaveLength(2);
    });

    it("'all' returns all formats", () => {
      const result = filterFilmCatalog(stocks, "", "all", "all");
      expect(result).toHaveLength(5);
    });
  });

  describe("process filter", () => {
    it("filters for C-41", () => {
      const result = filterFilmCatalog(stocks, "", "all", "C-41");
      expect(result).toHaveLength(2);
    });

    it("filters for BW", () => {
      const result = filterFilmCatalog(stocks, "", "all", "BW");
      expect(result).toHaveLength(2);
    });

    it("'all' returns all processes", () => {
      const result = filterFilmCatalog(stocks, "", "all", "all");
      expect(result).toHaveLength(5);
    });
  });

  describe("combined filters", () => {
    it("search + format", () => {
      const result = filterFilmCatalog(stocks, "kodak", "35mm", "all");
      expect(result).toHaveLength(2);
    });

    it("search + process", () => {
      const result = filterFilmCatalog(stocks, "kodak", "all", "BW");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Tri-X 400");
    });

    it("format + process", () => {
      const result = filterFilmCatalog(stocks, "", "4x5", "BW");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("HP5 Plus");
    });
  });
});
