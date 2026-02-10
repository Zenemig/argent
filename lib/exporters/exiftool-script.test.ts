import { describe, it, expect } from "vitest";
import { generateShellScript, generateBatchScript } from "./exiftool-script";
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

describe("generateShellScript", () => {
  it("starts with shebang line", () => {
    const script = generateShellScript([makeInput()]);
    expect(script.startsWith("#!/bin/sh")).toBe(true);
  });

  it("includes exiftool command", () => {
    const script = generateShellScript([makeInput()]);
    expect(script).toContain("exiftool");
  });

  it("includes -overwrite_original flag", () => {
    const script = generateShellScript([makeInput()]);
    expect(script).toContain("-overwrite_original");
  });

  it("includes camera make and model", () => {
    const script = generateShellScript([makeInput()]);
    expect(script).toContain("-Make=Nikon");
    expect(script).toContain("-Model=FM2");
  });

  it("includes lens model", () => {
    const script = generateShellScript([makeInput()]);
    expect(script).toContain("-LensModel=Nikkor 50mm f/1.4");
  });

  it("includes exposure settings", () => {
    const script = generateShellScript([makeInput()]);
    expect(script).toContain("-FNumber=5.6");
    expect(script).toContain("-ExposureTime=1/125");
    expect(script).toContain("-ISO=400");
  });

  it("includes GPS coordinates", () => {
    const script = generateShellScript([makeInput()]);
    expect(script).toContain("-GPSLatitude=");
    expect(script).toContain("-GPSLatitudeRef=N");
    expect(script).toContain("-GPSLongitudeRef=W");
  });

  it("omits GPS when coordinates are null", () => {
    const input = makeInput({
      frame: { ...makeInput().frame, latitude: null, longitude: null },
    });
    const script = generateShellScript([input]);
    expect(script).not.toContain("-GPSLatitude");
  });

  it("includes the target filename", () => {
    const script = generateShellScript([makeInput()]);
    expect(script).toContain("scan_001.tif");
  });

  it("generates one exiftool command per frame", () => {
    const inputs = [
      makeInput({ filename: "scan_001.tif" }),
      makeInput({
        frame: { ...makeInput().frame, frameNumber: 2 },
        filename: "scan_002.tif",
      }),
    ];
    const script = generateShellScript(inputs);
    const commands = script.match(/exiftool -overwrite_original/g);
    expect(commands?.length).toBe(2);
  });

  it("shell-escapes single quotes in values", () => {
    const input = makeInput({
      frame: { ...makeInput().frame, notes: "It's a test" },
    });
    const script = generateShellScript([input]);
    // Single quotes are escaped as: 'It'\''s a test'
    expect(script).toContain("'\\''");
  });

  it("includes creator when provided", () => {
    const script = generateShellScript([makeInput()], {
      creatorName: "Jane Doe",
    });
    expect(script).toContain("-Creator=Jane Doe");
  });

  it("includes copyright when provided", () => {
    const script = generateShellScript([makeInput()], {
      copyright: "2026 Jane Doe",
    });
    expect(script).toContain("-Copyright=2026 Jane Doe");
  });

  it("omits lens flags when lens is null", () => {
    const script = generateShellScript([makeInput({ lens: null })]);
    expect(script).not.toContain("-LensModel");
    expect(script).not.toContain("-FocalLength");
  });

  it("ends with a done message", () => {
    const script = generateShellScript([makeInput()]);
    expect(script).toContain("Done.");
  });
});

describe("generateBatchScript", () => {
  it("starts with @echo off", () => {
    const script = generateBatchScript([makeInput()]);
    expect(script.startsWith("@echo off")).toBe(true);
  });

  it("includes exiftool command", () => {
    const script = generateBatchScript([makeInput()]);
    expect(script).toContain("exiftool");
  });

  it("includes -overwrite_original flag", () => {
    const script = generateBatchScript([makeInput()]);
    expect(script).toContain("-overwrite_original");
  });

  it("includes camera make and model", () => {
    const script = generateBatchScript([makeInput()]);
    expect(script).toContain("-Make=Nikon");
    expect(script).toContain("-Model=FM2");
  });

  it("uses Windows line endings (CRLF)", () => {
    const script = generateBatchScript([makeInput()]);
    expect(script).toContain("\r\n");
  });

  it("ends with pause command", () => {
    const script = generateBatchScript([makeInput()]);
    expect(script.trimEnd().endsWith("pause")).toBe(true);
  });

  it("escapes batch special characters", () => {
    const input = makeInput({
      frame: { ...makeInput().frame, notes: "Test & verify <result>" },
    });
    const script = generateBatchScript([input]);
    expect(script).toContain("^&");
    expect(script).toContain("^<");
    expect(script).toContain("^>");
  });
});
