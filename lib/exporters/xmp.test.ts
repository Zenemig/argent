import { describe, it, expect } from "vitest";
import {
  generateXMP,
  generateXMPBatch,
  type XMPExportInput,
  type XMPExportOptions,
  type XMPFrameData,
  type XMPRollData,
  type XMPCameraData,
  type XMPLensData,
  type XMPFilmData,
} from "./xmp";

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

const makeFrame = (overrides?: Partial<XMPFrameData>): XMPFrameData => ({
  frameNumber: 1,
  shutterSpeed: "1/125",
  aperture: 5.6,
  focalLength: 50,
  latitude: 40.7128,
  longitude: -74.006,
  locationName: "New York",
  notes: "Test shot",
  capturedAt: new Date("2026-02-08T14:32:15").getTime(),
  ...overrides,
});

const makeRoll = (overrides?: Partial<XMPRollData>): XMPRollData => ({
  ei: 400,
  pushPull: 0,
  ...overrides,
});

const makeCamera = (overrides?: Partial<XMPCameraData>): XMPCameraData => ({
  make: "Nikon",
  name: "FM2",
  ...overrides,
});

const makeLens = (overrides?: Partial<XMPLensData>): XMPLensData => ({
  name: "Nikkor 50mm f/1.4 AI-S",
  focalLength: 50,
  ...overrides,
});

const makeFilm = (overrides?: Partial<XMPFilmData>): XMPFilmData => ({
  brand: "Kodak",
  name: "Portra 400",
  iso: 400,
  ...overrides,
});

const makeInput = (overrides?: Partial<XMPExportInput>): XMPExportInput => ({
  frame: makeFrame(),
  roll: makeRoll(),
  camera: makeCamera(),
  lens: makeLens(),
  film: makeFilm(),
  filename: "scan_001.tif",
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateXMP", () => {
  it("generates well-formed XML", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<x:xmpmeta");
    expect(xml).toContain("</x:xmpmeta>");
    expect(xml).toContain("<rdf:RDF");
    expect(xml).toContain("</rdf:RDF>");
  });

  it("includes all required XMP namespaces", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain('xmlns:tiff="http://ns.adobe.com/tiff/1.0/"');
    expect(xml).toContain('xmlns:exif="http://ns.adobe.com/exif/1.0/"');
    expect(xml).toContain('xmlns:exifEX="http://cipa.jp/exif/1.0/"');
    expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    expect(xml).toContain('xmlns:xmp="http://ns.adobe.com/xap/1.0/"');
  });

  it("includes camera make and model", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("<tiff:Make>Nikon</tiff:Make>");
    expect(xml).toContain("<tiff:Model>FM2</tiff:Model>");
  });

  it("includes lens model when provided", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain(
      "<exifEX:LensModel>Nikkor 50mm f/1.4 AI-S</exifEX:LensModel>",
    );
  });

  it("omits lens model when lens is null", () => {
    const xml = generateXMP(makeInput({ lens: null }));
    expect(xml).not.toContain("exifEX:LensModel");
  });

  it("includes focal length from lens", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("<exif:FocalLength>50</exif:FocalLength>");
  });

  it("uses frame focalLength when lens is null", () => {
    const xml = generateXMP(
      makeInput({ lens: null, frame: makeFrame({ focalLength: 35 }) }),
    );
    expect(xml).toContain("<exif:FocalLength>35</exif:FocalLength>");
  });

  it("includes aperture", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("<exif:FNumber>5.6</exif:FNumber>");
  });

  it("includes shutter speed", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("<exif:ExposureTime>1/125</exif:ExposureTime>");
  });

  it("converts seconds shutter speed for XMP", () => {
    const xml = generateXMP(
      makeInput({ frame: makeFrame({ shutterSpeed: "2s" }) }),
    );
    expect(xml).toContain("<exif:ExposureTime>2/1</exif:ExposureTime>");
  });

  it("omits ExposureTime for bare B", () => {
    const xml = generateXMP(
      makeInput({ frame: makeFrame({ shutterSpeed: "B" }) }),
    );
    expect(xml).not.toContain("exif:ExposureTime");
  });

  it("includes ISO in rdf:Seq", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("<exif:ISOSpeedRatings>");
    expect(xml).toContain("<rdf:li>400</rdf:li>");
  });

  it("includes DateTimeOriginal in EXIF format", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("<exif:DateTimeOriginal>");
    // Should contain date in yyyy:MM:dd HH:mm:ss format
    expect(xml).toMatch(/2026:02:08 \d{2}:\d{2}:\d{2}/);
  });

  it("includes GPS coordinates when present", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("<exif:GPSLatitude>");
    expect(xml).toContain("<exif:GPSLatitudeRef>N</exif:GPSLatitudeRef>");
    expect(xml).toContain("<exif:GPSLongitude>");
    expect(xml).toContain("<exif:GPSLongitudeRef>W</exif:GPSLongitudeRef>");
  });

  it("omits GPS when coordinates are null", () => {
    const xml = generateXMP(
      makeInput({
        frame: makeFrame({ latitude: null, longitude: null }),
      }),
    );
    expect(xml).not.toContain("GPSLatitude");
    expect(xml).not.toContain("GPSLongitude");
  });

  it("includes description with film stock and frame number", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("Kodak Portra 400");
    expect(xml).toContain("Frame #1");
  });

  it("includes push/pull info in description", () => {
    const xml = generateXMP(makeInput({ roll: makeRoll({ pushPull: 1 }) }));
    expect(xml).toContain("+1 push");
  });

  it("includes pull info in description", () => {
    const xml = generateXMP(makeInput({ roll: makeRoll({ pushPull: -2 }) }));
    expect(xml).toContain("-2 pull");
  });

  it("includes EI vs box speed when different", () => {
    const xml = generateXMP(
      makeInput({
        roll: makeRoll({ ei: 800, pushPull: 1 }),
        film: makeFilm({ iso: 400 }),
      }),
    );
    expect(xml).toContain("@ EI 800 (box 400)");
  });

  it("omits EI note when EI matches box speed", () => {
    const xml = generateXMP(
      makeInput({
        roll: makeRoll({ ei: 400 }),
        film: makeFilm({ iso: 400 }),
      }),
    );
    expect(xml).not.toContain("@ EI");
  });

  it("includes film stock as dc:subject keyword", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("<dc:subject>");
    expect(xml).toContain("<rdf:Bag>");
    expect(xml).toContain("<rdf:li>Kodak Portra 400</rdf:li>");
  });

  it("includes location name as keyword when present", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain("<rdf:li>New York</rdf:li>");
  });

  it("includes creator when provided", () => {
    const xml = generateXMP(makeInput(), { creatorName: "Jane Photographer" });
    expect(xml).toContain("<dc:creator>");
    expect(xml).toContain("<rdf:li>Jane Photographer</rdf:li>");
  });

  it("omits creator when not provided", () => {
    const xml = generateXMP(makeInput(), {});
    expect(xml).not.toContain("<dc:creator>");
  });

  it("includes copyright when provided", () => {
    const xml = generateXMP(makeInput(), {
      copyright: "2026 Jane. All rights reserved.",
    });
    expect(xml).toContain("<dc:rights>");
    expect(xml).toContain("2026 Jane. All rights reserved.");
  });

  it("omits copyright when not provided", () => {
    const xml = generateXMP(makeInput(), {});
    expect(xml).not.toContain("<dc:rights>");
  });

  it("always includes CreatorTool", () => {
    const xml = generateXMP(makeInput());
    expect(xml).toContain(
      "<xmp:CreatorTool>Argent Film Logger</xmp:CreatorTool>",
    );
  });

  it("escapes XML special characters in user text", () => {
    const xml = generateXMP(
      makeInput({
        frame: makeFrame({ notes: 'Shot at <sunset> & "golden hour"' }),
      }),
    );
    expect(xml).toContain("&lt;sunset&gt;");
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;golden hour&quot;");
    // Must not contain raw unescaped characters
    expect(xml).not.toMatch(/<sunset>/);
  });

  it("escapes XML in camera make/model", () => {
    const xml = generateXMP(
      makeInput({ camera: makeCamera({ make: "R&D Corp", name: 'Model "X"' }) }),
    );
    expect(xml).toContain("R&amp;D Corp");
    expect(xml).toContain("Model &quot;X&quot;");
  });
});

describe("generateXMPBatch", () => {
  it("generates one XMP file per input", () => {
    const inputs = [
      makeInput({ filename: "scan_001.tif" }),
      makeInput({
        frame: makeFrame({ frameNumber: 2 }),
        filename: "scan_002.tif",
      }),
      makeInput({
        frame: makeFrame({ frameNumber: 3 }),
        filename: "scan_003.tif",
      }),
    ];

    const result = generateXMPBatch(inputs);
    expect(result.size).toBe(3);
  });

  it("replaces file extension with .xmp", () => {
    const inputs = [makeInput({ filename: "scan_001.tif" })];
    const result = generateXMPBatch(inputs);
    expect(result.has("scan_001.xmp")).toBe(true);
  });

  it("handles various extensions", () => {
    const inputs = [
      makeInput({ filename: "photo.jpg" }),
      makeInput({
        frame: makeFrame({ frameNumber: 2 }),
        filename: "raw.dng",
      }),
      makeInput({
        frame: makeFrame({ frameNumber: 3 }),
        filename: "scan.tiff",
      }),
    ];
    const result = generateXMPBatch(inputs);
    expect(result.has("photo.xmp")).toBe(true);
    expect(result.has("raw.xmp")).toBe(true);
    expect(result.has("scan.xmp")).toBe(true);
  });

  it("passes options to each XMP generation", () => {
    const inputs = [makeInput({ filename: "scan_001.tif" })];
    const options: XMPExportOptions = { creatorName: "Test User" };
    const result = generateXMPBatch(inputs, options);
    const content = result.get("scan_001.xmp")!;
    expect(content).toContain("Test User");
  });

  it("returns empty map for empty input", () => {
    const result = generateXMPBatch([]);
    expect(result.size).toBe(0);
  });
});
