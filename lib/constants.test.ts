import { describe, it, expect } from "vitest";
import {
  DEFAULT_FRAME_COUNTS,
  FILM_FORMATS,
  ROLL_STATUSES,
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
  it("has exactly 6 statuses", () => {
    expect(ROLL_STATUSES).toHaveLength(6);
  });

  it("first status is loaded", () => {
    expect(ROLL_STATUSES[0]).toBe("loaded");
  });

  it("last status is archived", () => {
    expect(ROLL_STATUSES[ROLL_STATUSES.length - 1]).toBe("archived");
  });
});
