import { describe, it, expect } from "vitest";
import {
  DEFAULT_FRAME_COUNTS,
  FILM_FORMATS,
  ROLL_STATUSES,
  formatLabel,
} from "./constants";

describe("DEFAULT_FRAME_COUNTS", () => {
  it("has an entry for every FILM_FORMAT", () => {
    for (const format of FILM_FORMATS) {
      expect(DEFAULT_FRAME_COUNTS[format]).toBeDefined();
    }
  });

  it("all values are positive integers", () => {
    for (const format of FILM_FORMATS) {
      const count = DEFAULT_FRAME_COUNTS[format];
      expect(Number.isInteger(count)).toBe(true);
      expect(count).toBeGreaterThan(0);
    }
  });

  it("35mm defaults to 36", () => {
    expect(DEFAULT_FRAME_COUNTS["35mm"]).toBe(36);
  });

  it("120 defaults to 12", () => {
    expect(DEFAULT_FRAME_COUNTS["120"]).toBe(12);
  });

  it("4x5 defaults to 1", () => {
    expect(DEFAULT_FRAME_COUNTS["4x5"]).toBe(1);
  });

  it("8x10 defaults to 1", () => {
    expect(DEFAULT_FRAME_COUNTS["8x10"]).toBe(1);
  });

  it("instant defaults to 1", () => {
    expect(DEFAULT_FRAME_COUNTS["instant"]).toBe(1);
  });
});

describe("ROLL_STATUSES", () => {
  it("has 7 statuses (6 lifecycle + discarded)", () => {
    expect(ROLL_STATUSES).toHaveLength(7);
  });

  it("first status is loaded", () => {
    expect(ROLL_STATUSES[0]).toBe("loaded");
  });

  it("includes discarded as a terminal status", () => {
    expect(ROLL_STATUSES).toContain("discarded");
  });

  it("contains all linear lifecycle statuses", () => {
    expect(ROLL_STATUSES).toContain("loaded");
    expect(ROLL_STATUSES).toContain("active");
    expect(ROLL_STATUSES).toContain("finished");
    expect(ROLL_STATUSES).toContain("developed");
    expect(ROLL_STATUSES).toContain("scanned");
    expect(ROLL_STATUSES).toContain("archived");
  });
});

describe("formatLabel", () => {
  it("capitalizes simple lowercase words", () => {
    expect(formatLabel("other")).toBe("Other");
    expect(formatLabel("instant")).toBe("Instant");
    expect(formatLabel("fixed")).toBe("Fixed");
    expect(formatLabel("rangefinder")).toBe("Rangefinder");
    expect(formatLabel("view")).toBe("View");
  });

  it("uses acronym overrides", () => {
    expect(formatLabel("slr")).toBe("SLR");
    expect(formatLabel("tlr")).toBe("TLR");
    expect(formatLabel("point-and-shoot")).toBe("Point & Shoot");
    expect(formatLabel("medium-format-slr")).toBe("Medium Format SLR");
  });

  it("preserves already-capitalized values", () => {
    expect(formatLabel("C-41")).toBe("C-41");
    expect(formatLabel("E-6")).toBe("E-6");
    expect(formatLabel("BW")).toBe("BW");
    expect(formatLabel("Nikon F")).toBe("Nikon F");
  });

  it("preserves numeric formats", () => {
    expect(formatLabel("35mm")).toBe("35mm");
    expect(formatLabel("120")).toBe("120");
    expect(formatLabel("4x5")).toBe("4x5");
  });
});
