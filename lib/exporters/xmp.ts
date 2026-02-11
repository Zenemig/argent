/**
 * XMP Sidecar Generator
 *
 * Generates XMP/RDF XML files compatible with Lightroom Classic and Capture One.
 * Uses standard namespaces: tiff, exif, exifEX, dc, xmp, photoshop.
 */

import { format } from "date-fns";
import { convertGPSPair } from "./utils/gps-converter";
import { formatShutterForXMP } from "./utils/shutter-parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface XMPFrameData {
  frameNumber: number;
  shutterSpeed: string;
  aperture: number;
  focalLength: number | null;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  locationName: string | null | undefined;
  notes: string | null | undefined;
  capturedAt: number; // Unix ms
}

export interface XMPRollData {
  ei: number;
  pushPull: number;
}

export interface XMPCameraData {
  make: string;
  name: string;
}

export interface XMPLensData {
  name: string;
  focalLength: number;
  focalLengthMax?: number | null;
  maxAperture?: number;
  minAperture?: number | null;
}

export interface XMPFilmData {
  brand: string;
  name: string;
  iso: number;
}

export interface XMPExportInput {
  frame: XMPFrameData;
  roll: XMPRollData;
  camera: XMPCameraData;
  lens: XMPLensData | null;
  film: XMPFilmData;
  filename: string;
}

export interface XMPExportOptions {
  creatorName?: string | null;
  copyright?: string | null;
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value: string | number): string {
  return `      <${name}>${escapeXML(String(value))}</${name}>`;
}

function rdfAlt(name: string, value: string): string {
  return [
    `      <${name}>`,
    `        <rdf:Alt>`,
    `          <rdf:li xml:lang="x-default">${escapeXML(value)}</rdf:li>`,
    `        </rdf:Alt>`,
    `      </${name}>`,
  ].join("\n");
}

function rdfBag(name: string, items: string[]): string {
  const lis = items.map((i) => `          <rdf:li>${escapeXML(i)}</rdf:li>`);
  return [
    `      <${name}>`,
    `        <rdf:Bag>`,
    ...lis,
    `        </rdf:Bag>`,
    `      </${name}>`,
  ].join("\n");
}

function rdfSeq(name: string, items: (string | number)[]): string {
  const lis = items.map(
    (i) => `          <rdf:li>${escapeXML(String(i))}</rdf:li>`,
  );
  return [
    `      <${name}>`,
    `        <rdf:Seq>`,
    ...lis,
    `        </rdf:Seq>`,
    `      </${name}>`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Description builder
// ---------------------------------------------------------------------------

function buildDescription(
  film: XMPFilmData,
  roll: XMPRollData,
  frame: XMPFrameData,
): string {
  const parts: string[] = [];
  parts.push(`${film.brand} ${film.name}`);

  if (roll.ei !== film.iso) {
    parts.push(`@ EI ${roll.ei} (box ${film.iso})`);
  }

  parts.push(`Frame #${frame.frameNumber}`);

  if (roll.pushPull !== 0) {
    const sign = roll.pushPull > 0 ? "+" : "";
    const label = roll.pushPull > 0 ? "push" : "pull";
    parts.push(`${sign}${roll.pushPull} ${label}`);
  }

  if (frame.notes) {
    parts.push(frame.notes);
  }

  return parts.join(", ");
}

// ---------------------------------------------------------------------------
// XMP generator
// ---------------------------------------------------------------------------

/**
 * Generate a single XMP sidecar XML string for one frame.
 */
export function generateXMP(
  input: XMPExportInput,
  options: XMPExportOptions = {},
): string {
  const { frame, roll, camera, lens, film } = input;

  const lines: string[] = [];

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<x:xmpmeta xmlns:x="adobe:ns:meta/">`);
  lines.push(`  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">`);
  lines.push(`    <rdf:Description`);
  lines.push(`      xmlns:tiff="http://ns.adobe.com/tiff/1.0/"`);
  lines.push(`      xmlns:exif="http://ns.adobe.com/exif/1.0/"`);
  lines.push(`      xmlns:exifEX="http://cipa.jp/exif/1.0/"`);
  lines.push(`      xmlns:dc="http://purl.org/dc/elements/1.1/"`);
  lines.push(`      xmlns:xmp="http://ns.adobe.com/xap/1.0/"`);
  lines.push(`      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">`);

  // Camera
  lines.push(tag("tiff:Make", camera.make));
  lines.push(tag("tiff:Model", camera.name));

  // Lens
  if (lens) {
    lines.push(tag("exifEX:LensModel", lens.name));
    // Prefer per-frame focal length (zoom lens) over lens default
    const fl = frame.focalLength ?? lens.focalLength;
    lines.push(tag("exif:FocalLength", fl));
    // LensSpecification for zoom lenses: [fMin, fMax, apertureMin, apertureMax]
    if (lens.focalLengthMax != null) {
      const fMin = lens.focalLength;
      const fMax = lens.focalLengthMax;
      const aMax = lens.maxAperture ?? 0;
      const aMin = lens.minAperture ?? aMax;
      lines.push(
        rdfSeq("exifEX:LensSpecification", [fMin, fMax, aMax, aMin]),
      );
    }
  } else if (frame.focalLength != null) {
    lines.push(tag("exif:FocalLength", frame.focalLength));
  }

  // Exposure
  lines.push(tag("exif:FNumber", frame.aperture));

  const xmpShutter = formatShutterForXMP(frame.shutterSpeed);
  if (xmpShutter) {
    lines.push(tag("exif:ExposureTime", xmpShutter));
  }

  // ISO as rdf:Seq (XMP standard for ISOSpeedRatings)
  lines.push(rdfSeq("exif:ISOSpeedRatings", [roll.ei]));

  // Date
  const dateStr = format(frame.capturedAt, "yyyy:MM:dd HH:mm:ss");
  lines.push(tag("exif:DateTimeOriginal", dateStr));

  // GPS (only if coordinates present)
  const gps = convertGPSPair(frame.latitude, frame.longitude);
  if (gps) {
    lines.push(tag("exif:GPSLatitude", gps.latitude));
    lines.push(tag("exif:GPSLatitudeRef", gps.latitudeRef));
    lines.push(tag("exif:GPSLongitude", gps.longitude));
    lines.push(tag("exif:GPSLongitudeRef", gps.longitudeRef));
  }

  // Description
  const description = buildDescription(film, roll, frame);
  lines.push(rdfAlt("dc:description", description));

  // Keywords
  const keywords: string[] = [`${film.brand} ${film.name}`];
  if (frame.locationName) {
    keywords.push(frame.locationName);
  }
  lines.push(rdfBag("dc:subject", keywords));

  // Creator
  if (options.creatorName) {
    lines.push(rdfSeq("dc:creator", [options.creatorName]));
  }

  // Copyright
  if (options.copyright) {
    lines.push(rdfAlt("dc:rights", options.copyright));
  }

  // Creator tool
  lines.push(tag("xmp:CreatorTool", "Argent Film Logger"));

  lines.push(`    </rdf:Description>`);
  lines.push(`  </rdf:RDF>`);
  lines.push(`</x:xmpmeta>`);

  return lines.join("\n");
}

/**
 * Generate XMP for a batch of frames.
 * Returns a Map of XMP filename → XMP content string.
 */
export function generateXMPBatch(
  inputs: XMPExportInput[],
  options: XMPExportOptions = {},
): Map<string, string> {
  const result = new Map<string, string>();

  for (const input of inputs) {
    const xmpFilename = input.filename.replace(/\.[^.]+$/, ".xmp");
    const content = generateXMP(input, options);
    result.set(xmpFilename, content);
  }

  return result;
}
