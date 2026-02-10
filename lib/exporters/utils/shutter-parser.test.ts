import { describe, it, expect } from "vitest";
import { parseShutterSpeed, formatShutterForXMP } from "./shutter-parser";

describe("parseShutterSpeed", () => {
  it("parses fraction 1/125", () => {
    expect(parseShutterSpeed("1/125")).toBe(1 / 125);
  });

  it("parses fraction 1/2", () => {
    expect(parseShutterSpeed("1/2")).toBe(0.5);
  });

  it("parses fraction 1/8000", () => {
    expect(parseShutterSpeed("1/8000")).toBe(1 / 8000);
  });

  it("parses seconds notation 1s", () => {
    expect(parseShutterSpeed("1s")).toBe(1);
  });

  it("parses seconds notation 30s", () => {
    expect(parseShutterSpeed("30s")).toBe(30);
  });

  it("parses bulb with minutes: B 4m", () => {
    expect(parseShutterSpeed("B 4m")).toBe(240);
  });

  it("parses bulb with minutes and seconds: B 2m30s", () => {
    expect(parseShutterSpeed("B 2m30s")).toBe(150);
  });

  it("parses bulb with seconds: B 30s", () => {
    expect(parseShutterSpeed("B 30s")).toBe(30);
  });

  it("returns null for bare B (no duration)", () => {
    expect(parseShutterSpeed("B")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseShutterSpeed("fast")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseShutterSpeed("")).toBeNull();
  });

  it("returns null for division by zero", () => {
    expect(parseShutterSpeed("1/0")).toBeNull();
  });

  it("handles whitespace", () => {
    expect(parseShutterSpeed(" 1/125 ")).toBe(1 / 125);
  });
});

describe("formatShutterForXMP", () => {
  it("passes through fractions: 1/125", () => {
    expect(formatShutterForXMP("1/125")).toBe("1/125");
  });

  it("converts seconds to rational: 2s -> 2/1", () => {
    expect(formatShutterForXMP("2s")).toBe("2/1");
  });

  it("converts 30s to 30/1", () => {
    expect(formatShutterForXMP("30s")).toBe("30/1");
  });

  it("converts bulb 4m to 240/1", () => {
    expect(formatShutterForXMP("B 4m")).toBe("240/1");
  });

  it("returns null for bare B", () => {
    expect(formatShutterForXMP("B")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(formatShutterForXMP("invalid")).toBeNull();
  });
});
