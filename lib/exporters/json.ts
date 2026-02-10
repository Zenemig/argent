/**
 * JSON Backup Exporter
 *
 * Full-context JSON export containing roll, camera, film, lenses, and frames.
 * Designed for data portability — contains everything needed to reconstruct
 * the roll's metadata without access to the database.
 */

import type {
  ExportInput,
  ExportOptions,
  JSONExportData,
} from "./types";

/**
 * Generate a full JSON export from a batch of export inputs.
 * Deduplicates shared data (roll, camera, film) from the first input
 * and collects per-frame data into an array.
 */
export function generateJSON(
  inputs: ExportInput[],
  options: ExportOptions = {},
): string {
  if (inputs.length === 0) {
    return JSON.stringify({ exportedAt: new Date().toISOString(), generator: "Argent Film Logger", frames: [] }, null, 2);
  }

  const first = inputs[0];

  // Collect unique lenses
  const lensMap = new Map<string, ExportInput["lens"]>();
  for (const input of inputs) {
    if (input.lens) {
      lensMap.set(input.lens.name, input.lens);
    }
  }

  const data: JSONExportData = {
    exportedAt: new Date().toISOString(),
    generator: "Argent Film Logger",
    roll: first.roll,
    camera: first.camera,
    film: first.film,
    lenses: [...lensMap.values()].filter(
      (l): l is NonNullable<typeof l> => l != null,
    ),
    frames: inputs.map((input) => ({
      ...input.frame,
      lensName: input.lens?.name ?? null,
      filename: input.filename,
    })),
    options,
  };

  return JSON.stringify(data, null, 2);
}
