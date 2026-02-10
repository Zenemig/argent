import { describe, it, expect } from "vitest";
import { decimalToXMPGPS, convertGPSPair } from "./gps-converter";

describe("decimalToXMPGPS", () => {
  it("converts positive latitude (North)", () => {
    const result = decimalToXMPGPS(40.7128, true);
    expect(result.ref).toBe("N");
    expect(result.value).toMatch(/^40,42\.7680$/);
  });

  it("converts negative latitude (South)", () => {
    const result = decimalToXMPGPS(-33.8688, true);
    expect(result.ref).toBe("S");
    expect(result.value).toMatch(/^33,52\.1280$/);
  });

  it("converts positive longitude (East)", () => {
    const result = decimalToXMPGPS(2.3522, false);
    expect(result.ref).toBe("E");
    expect(result.value).toMatch(/^2,21\.1320$/);
  });

  it("converts negative longitude (West)", () => {
    const result = decimalToXMPGPS(-74.006, false);
    expect(result.ref).toBe("W");
    expect(result.value).toMatch(/^74,0\.3600$/);
  });

  it("handles zero latitude", () => {
    const result = decimalToXMPGPS(0, true);
    expect(result.ref).toBe("N");
    expect(result.value).toBe("0,0.0000");
  });

  it("handles zero longitude", () => {
    const result = decimalToXMPGPS(0, false);
    expect(result.ref).toBe("E");
    expect(result.value).toBe("0,0.0000");
  });
});

describe("convertGPSPair", () => {
  it("converts a valid lat/lon pair", () => {
    const result = convertGPSPair(40.7128, -74.006);
    expect(result).not.toBeNull();
    expect(result!.latitudeRef).toBe("N");
    expect(result!.longitudeRef).toBe("W");
  });

  it("returns null when latitude is null", () => {
    expect(convertGPSPair(null, -74.006)).toBeNull();
  });

  it("returns null when longitude is null", () => {
    expect(convertGPSPair(40.7128, null)).toBeNull();
  });

  it("returns null when both are null", () => {
    expect(convertGPSPair(null, null)).toBeNull();
  });

  it("returns null when latitude is undefined", () => {
    expect(convertGPSPair(undefined, -74.006)).toBeNull();
  });

  it("returns null when longitude is undefined", () => {
    expect(convertGPSPair(40.7128, undefined)).toBeNull();
  });
});
