import { describe, it, expect } from "vitest";
import { generateJSON } from "./json";
import type { ExportInput, JSONExportData } from "./types";

const makeInput = (overrides?: Partial<ExportInput>): ExportInput => ({
  frame: {
    frameNumber: 1,
    shutterSpeed: "1/125",
    aperture: 5.6,
    focalLength: 50,
    latitude: 40.7128,
    longitude: -74.006,
    locationName: "New York",
    notes: "Test shot",
    capturedAt: new Date("2026-02-08T14:32:15").getTime(),
  },
  roll: {
    id: "01TESTROLL000000000000000",
    ei: 400,
    pushPull: 0,
    status: "scanned",
    frameCount: 36,
    startDate: Date.now(),
    finishDate: null,
    developDate: null,
    scanDate: null,
    labName: null,
    devNotes: null,
    notes: null,
  },
  camera: { make: "Nikon", name: "FM2", format: "35mm" },
  lens: { name: "Nikkor 50mm f/1.4", make: "Nikon", focalLength: 50, maxAperture: 1.4 },
  film: { brand: "Kodak", name: "Portra 400", iso: 400 },
  filename: "scan_001.tif",
  ...overrides,
});

describe("generateJSON", () => {
  it("returns valid JSON", () => {
    const json = generateJSON([makeInput()]);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("includes exportedAt timestamp", () => {
    const data: JSONExportData = JSON.parse(generateJSON([makeInput()]));
    expect(data.exportedAt).toBeDefined();
    // Should be ISO format
    expect(new Date(data.exportedAt).toISOString()).toBe(data.exportedAt);
  });

  it("includes generator name", () => {
    const data: JSONExportData = JSON.parse(generateJSON([makeInput()]));
    expect(data.generator).toBe("Argent Film Logger");
  });

  it("includes roll data", () => {
    const data: JSONExportData = JSON.parse(generateJSON([makeInput()]));
    expect(data.roll.ei).toBe(400);
    expect(data.roll.pushPull).toBe(0);
    expect(data.roll.status).toBe("scanned");
  });

  it("includes camera data", () => {
    const data: JSONExportData = JSON.parse(generateJSON([makeInput()]));
    expect(data.camera.make).toBe("Nikon");
    expect(data.camera.name).toBe("FM2");
  });

  it("includes film data", () => {
    const data: JSONExportData = JSON.parse(generateJSON([makeInput()]));
    expect(data.film.brand).toBe("Kodak");
    expect(data.film.name).toBe("Portra 400");
    expect(data.film.iso).toBe(400);
  });

  it("includes deduplicated lenses", () => {
    const inputs = [
      makeInput({ filename: "scan_001.tif" }),
      makeInput({
        frame: { ...makeInput().frame, frameNumber: 2 },
        filename: "scan_002.tif",
      }),
    ];
    const data: JSONExportData = JSON.parse(generateJSON(inputs));
    // Same lens used twice, should appear once
    expect(data.lenses.length).toBe(1);
    expect(data.lenses[0].name).toBe("Nikkor 50mm f/1.4");
  });

  it("includes multiple lenses when different", () => {
    const inputs = [
      makeInput({ filename: "scan_001.tif" }),
      makeInput({
        frame: { ...makeInput().frame, frameNumber: 2 },
        lens: { name: "Nikkor 28mm f/2.8", make: "Nikon", focalLength: 28, maxAperture: 2.8 },
        filename: "scan_002.tif",
      }),
    ];
    const data: JSONExportData = JSON.parse(generateJSON(inputs));
    expect(data.lenses.length).toBe(2);
  });

  it("includes all frames with their data", () => {
    const inputs = [
      makeInput({ filename: "scan_001.tif" }),
      makeInput({
        frame: { ...makeInput().frame, frameNumber: 2 },
        filename: "scan_002.tif",
      }),
    ];
    const data: JSONExportData = JSON.parse(generateJSON(inputs));
    expect(data.frames.length).toBe(2);
    expect(data.frames[0].frameNumber).toBe(1);
    expect(data.frames[1].frameNumber).toBe(2);
  });

  it("includes lensName on each frame", () => {
    const data: JSONExportData = JSON.parse(generateJSON([makeInput()]));
    expect(data.frames[0].lensName).toBe("Nikkor 50mm f/1.4");
  });

  it("sets lensName to null when lens is missing", () => {
    const data: JSONExportData = JSON.parse(
      generateJSON([makeInput({ lens: null })]),
    );
    expect(data.frames[0].lensName).toBeNull();
  });

  it("includes filename on each frame", () => {
    const data: JSONExportData = JSON.parse(generateJSON([makeInput()]));
    expect(data.frames[0].filename).toBe("scan_001.tif");
  });

  it("includes options (creator, copyright)", () => {
    const data: JSONExportData = JSON.parse(
      generateJSON([makeInput()], {
        creatorName: "Jane",
        copyright: "2026 Jane",
      }),
    );
    expect(data.options.creatorName).toBe("Jane");
    expect(data.options.copyright).toBe("2026 Jane");
  });

  it("handles empty input array", () => {
    const json = generateJSON([]);
    const data = JSON.parse(json);
    expect(data.frames).toEqual([]);
    expect(data.generator).toBe("Argent Film Logger");
  });

  it("outputs pretty-printed JSON", () => {
    const json = generateJSON([makeInput()]);
    // Pretty-printed JSON has newlines and indentation
    expect(json).toContain("\n");
    expect(json).toContain("  ");
  });
});
