import { describe, it, expect } from "vitest";
import { generateCSV } from "./csv";
import type { ExportInput } from "./types";

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

describe("generateCSV", () => {
  it("includes header row with all required columns", () => {
    const csv = generateCSV([makeInput()]);
    const header = csv.split("\n")[0];
    expect(header).toBe(
      "SourceFile,Make,Model,LensModel,FocalLength,FNumber,ExposureTime,ISO,DateTimeOriginal,GPSLatitude,GPSLatitudeRef,GPSLongitude,GPSLongitudeRef,ImageDescription,Keywords",
    );
  });

  it("generates one data row per frame", () => {
    const inputs = [
      makeInput({ filename: "scan_001.tif" }),
      makeInput({
        frame: { ...makeInput().frame, frameNumber: 2 },
        filename: "scan_002.tif",
      }),
    ];
    const csv = generateCSV(inputs);
    const lines = csv.split("\n");
    expect(lines.length).toBe(3); // header + 2 rows
  });

  it("includes SourceFile as first column", () => {
    const csv = generateCSV([makeInput()]);
    const row = csv.split("\n")[1];
    expect(row.startsWith("scan_001.tif,")).toBe(true);
  });

  it("includes camera make and model", () => {
    const csv = generateCSV([makeInput()]);
    const row = csv.split("\n")[1];
    expect(row).toContain("Nikon");
    expect(row).toContain("FM2");
  });

  it("includes lens model", () => {
    const csv = generateCSV([makeInput()]);
    const row = csv.split("\n")[1];
    expect(row).toContain("Nikkor 50mm f/1.4");
  });

  it("handles missing lens gracefully", () => {
    const csv = generateCSV([makeInput({ lens: null })]);
    const row = csv.split("\n")[1];
    // Should have empty fields for LensModel and FocalLength
    const cols = row.split(",");
    expect(cols[3]).toBe(""); // LensModel
    expect(cols[4]).toBe(""); // FocalLength
  });

  it("includes ISO from roll.ei", () => {
    const csv = generateCSV([makeInput()]);
    const row = csv.split("\n")[1];
    expect(row).toContain(",400,");
  });

  it("formats date with EXIF colons: YYYY:MM:DD HH:MM:SS", () => {
    const csv = generateCSV([makeInput()]);
    const row = csv.split("\n")[1];
    expect(row).toMatch(/2026:02:08 \d{2}:\d{2}:\d{2}/);
  });

  it("includes GPS coordinates when present", () => {
    const csv = generateCSV([makeInput()]);
    const row = csv.split("\n")[1];
    expect(row).toContain(",N,");
    expect(row).toContain(",W,");
  });

  it("leaves GPS fields empty when coordinates are null", () => {
    const input = makeInput({
      frame: { ...makeInput().frame, latitude: null, longitude: null },
    });
    const csv = generateCSV([input]);
    const row = csv.split("\n")[1];
    const cols = row.split(",");
    expect(cols[9]).toBe(""); // GPSLatitude
    expect(cols[10]).toBe(""); // GPSLatitudeRef
    expect(cols[11]).toBe(""); // GPSLongitude
    expect(cols[12]).toBe(""); // GPSLongitudeRef
  });

  it("includes description with film stock and frame number", () => {
    const csv = generateCSV([makeInput()]);
    const row = csv.split("\n")[1];
    expect(row).toContain("Kodak Portra 400");
    expect(row).toContain("Frame #1");
  });

  it("escapes commas in values with double quotes", () => {
    const input = makeInput({
      frame: { ...makeInput().frame, notes: "Shot at dawn, very cold" },
    });
    const csv = generateCSV([input]);
    expect(csv).toContain('"');
  });

  it("escapes double quotes by doubling them", () => {
    const input = makeInput({
      frame: { ...makeInput().frame, notes: 'The "golden hour"' },
    });
    const csv = generateCSV([input]);
    expect(csv).toContain('""golden hour""');
  });

  it("returns only header for empty input", () => {
    const csv = generateCSV([]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(1);
  });

  it("omits ExposureTime for bare B (bulb)", () => {
    const input = makeInput({
      frame: { ...makeInput().frame, shutterSpeed: "B" },
    });
    const csv = generateCSV([input]);
    const row = csv.split("\n")[1];
    const cols = row.split(",");
    expect(cols[6]).toBe(""); // ExposureTime
  });
});
