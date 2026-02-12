import { describe, it, expect } from "vitest";
import {
  filterShutterSpeeds,
  filterApertures,
  filterMeteringModes,
} from "./gear-filters";
import { SHUTTER_SPEEDS, APERTURES, METERING_MODES } from "./constants";

describe("filterShutterSpeeds", () => {
  it("returns full array when all params are null", () => {
    expect(filterShutterSpeeds(null, null, null)).toEqual([...SHUTTER_SPEEDS]);
  });

  it("returns full array when all params are undefined", () => {
    expect(filterShutterSpeeds(undefined, undefined, undefined)).toEqual([
      ...SHUTTER_SPEEDS,
    ]);
  });

  it("filters from min to end when only min is set", () => {
    const result = filterShutterSpeeds("1s", null, null);
    expect(result[0]).toBe("B");
    expect(result[1]).toBe("1s");
    expect(result[result.length - 1]).toBe("1/8000");
    expect(result).not.toContain("2s");
  });

  it("filters from start to max when only max is set", () => {
    const result = filterShutterSpeeds(null, "1/1000", null);
    expect(result[0]).toBe("B");
    expect(result[1]).toBe("30s");
    expect(result[result.length - 1]).toBe("1/1000");
    expect(result).not.toContain("1/2000");
  });

  it("filters between min and max (inclusive), includes B by default", () => {
    const result = filterShutterSpeeds("1s", "1/4000", null);
    expect(result[0]).toBe("B");
    expect(result[1]).toBe("1s");
    expect(result[result.length - 1]).toBe("1/4000");
    expect(result).toContain("1/125");
    expect(result).not.toContain("8s");
    expect(result).not.toContain("1/8000");
  });

  it("excludes B when hasBulb is false", () => {
    const result = filterShutterSpeeds("1s", "1/4000", false);
    expect(result[0]).toBe("1s");
    expect(result).not.toContain("B");
  });

  it("includes B when hasBulb is true", () => {
    const result = filterShutterSpeeds("1s", "1/4000", true);
    expect(result[0]).toBe("B");
    expect(result[1]).toBe("1s");
  });

  it("includes B when hasBulb is null (unconstrained)", () => {
    const result = filterShutterSpeeds("1s", "1/4000", null);
    expect(result).toContain("B");
  });

  it("handles single value range (min === max)", () => {
    const result = filterShutterSpeeds("1/125", "1/125", false);
    expect(result).toEqual(["1/125"]);
  });

  it("returns only B when hasBulb is true and no timed speeds constrained", () => {
    const result = filterShutterSpeeds(null, null, true);
    expect(result[0]).toBe("B");
    expect(result.length).toBe(SHUTTER_SPEEDS.length);
  });

  it("returns timed speeds without B when hasBulb is false and no range set", () => {
    const result = filterShutterSpeeds(null, null, false);
    expect(result).not.toContain("B");
    expect(result[0]).toBe("30s");
    expect(result.length).toBe(SHUTTER_SPEEDS.length - 1);
  });
});

describe("filterApertures", () => {
  it("returns full array when both values are null", () => {
    expect(filterApertures(null, null)).toEqual([...APERTURES]);
  });

  it("returns full array when both are undefined", () => {
    expect(filterApertures(undefined, undefined)).toEqual([...APERTURES]);
  });

  it("filters from maxAperture to end when only maxAperture is set", () => {
    const result = filterApertures(2.8, null);
    expect(result[0]).toBe(2.8);
    expect(result).not.toContain(1.4);
    expect(result).toContain(16);
  });

  it("filters from start to apertureMin when only apertureMin is set", () => {
    const result = filterApertures(null, 16);
    expect(result[0]).toBe(0.95);
    expect(result[result.length - 1]).toBe(16);
    expect(result).not.toContain(22);
  });

  it("filters between maxAperture and apertureMin (inclusive)", () => {
    const result = filterApertures(1.4, 16);
    expect(result[0]).toBe(1.4);
    expect(result[result.length - 1]).toBe(16);
    expect(result).toContain(5.6);
    expect(result).not.toContain(0.95);
    expect(result).not.toContain(22);
  });

  it("handles single value range", () => {
    const result = filterApertures(5.6, 5.6);
    expect(result).toEqual([5.6]);
  });
});

describe("filterMeteringModes", () => {
  it("returns full array when allowed is null", () => {
    expect(filterMeteringModes(null)).toEqual([...METERING_MODES]);
  });

  it("returns full array when allowed is undefined", () => {
    expect(filterMeteringModes(undefined)).toEqual([...METERING_MODES]);
  });

  it("returns subset matching allowed modes", () => {
    const result = filterMeteringModes(["center", "sunny16"]);
    expect(result).toEqual(["center", "sunny16"]);
  });

  it("preserves METERING_MODES order", () => {
    const result = filterMeteringModes(["sunny16", "spot", "center"]);
    expect(result).toEqual(["spot", "center", "sunny16"]);
  });

  it("returns empty array when allowed is empty", () => {
    expect(filterMeteringModes([])).toEqual([]);
  });
});
