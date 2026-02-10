/**
 * ExifTool-compatible CSV Exporter
 *
 * Generates a CSV file that can be used with ExifTool's `-csv` flag:
 *   exiftool -csv=metadata.csv /path/to/scans/
 *
 * Date format uses EXIF standard: YYYY:MM:DD HH:MM:SS (colons in date).
 */

import { format } from "date-fns";
import { convertGPSPair } from "./utils/gps-converter";
import { formatShutterForXMP } from "./utils/shutter-parser";
import type { ExportInput, ExportOptions } from "./types";

const CSV_COLUMNS = [
  "SourceFile",
  "Make",
  "Model",
  "LensModel",
  "FocalLength",
  "FNumber",
  "ExposureTime",
  "ISO",
  "DateTimeOriginal",
  "GPSLatitude",
  "GPSLatitudeRef",
  "GPSLongitude",
  "GPSLongitudeRef",
  "ImageDescription",
  "Keywords",
] as const;

/**
 * Escape a value for CSV: wrap in quotes if it contains commas, quotes, or newlines.
 * Double any existing quotes per RFC 4180.
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Build the description string for a frame (matches XMP exporter).
 */
function buildDescription(
  film: ExportInput["film"],
  roll: ExportInput["roll"],
  frame: ExportInput["frame"],
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

/**
 * Generate a CSV row for a single frame.
 */
function frameToRow(input: ExportInput): string[] {
  const { frame, roll, camera, lens, film } = input;

  const gps = convertGPSPair(frame.latitude, frame.longitude);
  const shutter = formatShutterForXMP(frame.shutterSpeed);
  const dateStr = format(frame.capturedAt, "yyyy:MM:dd HH:mm:ss");
  const description = buildDescription(film, roll, frame);
  const keywords = `${film.brand} ${film.name}`;

  return [
    input.filename,
    camera.make,
    camera.name,
    lens?.name ?? "",
    lens ? String(lens.focalLength) : "",
    String(frame.aperture),
    shutter ?? "",
    String(roll.ei),
    dateStr,
    gps?.latitude ?? "",
    gps?.latitudeRef ?? "",
    gps?.longitude ?? "",
    gps?.longitudeRef ?? "",
    description,
    keywords,
  ];
}

/**
 * Generate an ExifTool-compatible CSV string from a batch of frames.
 */
export function generateCSV(
  inputs: ExportInput[],
  _options: ExportOptions = {},
): string {
  const header = CSV_COLUMNS.join(",");
  const rows = inputs.map((input) =>
    frameToRow(input).map(escapeCSV).join(","),
  );
  return [header, ...rows].join("\n");
}
