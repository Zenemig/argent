import { makeId, inferMountFormat } from "../shared/normalize.js";
import type { MountStockOutput } from "../shared/schemas.js";
import type { CornellMountRow } from "./parser.js";

/**
 * Name mapping: Cornell mount names -> Lensfun mount names.
 * Used to match entries between the two data sources.
 */
const CORNELL_TO_LENSFUN: Record<string, string> = {
  "Nikon F": "Nikon F",
  "Nikon F (AI, AI-S)": "Nikon F",
  "Nikon F (AF)": "Nikon F",
  "Canon FD": "Canon FD",
  "Canon EF": "Canon EF",
  "Canon EF-S": "Canon EF",
  "Pentax K": "Pentax K",
  "Pentax KA": "Pentax K",
  "M42 (Praktica/Pentax)": "M42",
  "M42": "M42",
  "M39 (LTM)": "M39",
  "Olympus OM": "Olympus OM",
  "Minolta MD": "Minolta MD",
  "Minolta MC": "Minolta MC",
  "Leica M": "Leica M",
  "Leica R": "Leica R",
  "Contax/Yashica": "Contax/Yashica",
  "Contax G": "Contax G",
  "Hasselblad V": "Hasselblad V",
  "Hasselblad 500": "Hasselblad V",
  "Mamiya RB67": "Mamiya RB67",
  "Mamiya RZ67": "Mamiya RZ67",
  "Mamiya 645": "Mamiya 645",
  "Pentax 67": "Pentax 67",
  "Pentax 6x7": "Pentax 67",
  "Pentax 645": "Pentax 645",
};

/**
 * Merge Cornell mount register distance data into existing Lensfun-sourced mounts.
 * Mounts from Cornell that don't exist in Lensfun data are added as new entries.
 */
export function mergeMountData(
  existing: MountStockOutput[],
  cornellRows: CornellMountRow[],
): MountStockOutput[] {
  // Build lookup by name (Lensfun names)
  const byName = new Map<string, MountStockOutput>();
  for (const m of existing) {
    byName.set(m.name, m);
  }

  // Merge Cornell data
  for (const row of cornellRows) {
    const lensfunName = CORNELL_TO_LENSFUN[row.name] ?? row.name;
    const existingMount = byName.get(lensfunName);

    if (existingMount) {
      // Enrich with register distance and diameter
      if (row.registerDistance !== null) existingMount.register_distance = row.registerDistance;
      if (row.mountDiameter !== null) existingMount.mount_diameter = row.mountDiameter;
      if (row.type !== "other") existingMount.type = row.type as MountStockOutput["type"];
    } else {
      // Add as new mount
      const newMount: MountStockOutput = {
        id: makeId("mount", row.name),
        name: row.name,
        type: row.type as MountStockOutput["type"],
        register_distance: row.registerDistance,
        mount_diameter: row.mountDiameter,
        compatible_mounts: [],
        format: inferMountFormat(row.name) as MountStockOutput["format"],
      };
      byName.set(row.name, newMount);
    }
  }

  return [...byName.values()];
}
