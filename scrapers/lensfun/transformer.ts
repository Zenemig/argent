import { normalizeBrand, normalizeMount, makeId, inferMountFormat } from "../shared/normalize.js";
import type { CameraStockOutput, LensStockOutput, MountStockOutput } from "../shared/schemas.js";
import type { RawLensfunCamera, RawLensfunLens, RawLensfunMount } from "./parser.js";

/**
 * Infer film format from Lensfun crop factor and mount.
 * Medium format crop factors range ~0.5 to ~0.8 depending on back size.
 */
function formatFromCropFactor(crop: number, mount: string): CameraStockOutput["format"] {
  // Mount-based override: most reliable indicator of medium format
  const MF_MOUNTS = ["Mamiya 645", "Mamiya RB/RZ67", "Mamiya 7", "Pentax 67", "Pentax 645", "Hasselblad V", "Fuji GX"];
  if (MF_MOUNTS.includes(mount)) return "120";
  if (crop <= 0.85) return "120"; // Medium format (6x4.5, 6x6, 6x7, 6x9)
  if (crop <= 1.1) return "35mm"; // Full frame
  // APS-C and smaller digital — map to "other" since we're analogue-focused
  return "other";
}

/**
 * Infer camera type from Lensfun file naming convention embedded in the data.
 * Lensfun organizes by slr-*, mil-*, compact-* prefixes.
 */
function inferCameraType(model: string, _mount: string): CameraStockOutput["type"] {
  const lower = model.toLowerCase();
  if (lower.includes("slr") || lower.includes("reflex")) return "slr";
  if (lower.includes("rangefinder")) return "rangefinder";
  if (lower.includes("compact") || lower.includes("point")) return "point-and-shoot";
  if (lower.includes("tlr") || lower.includes("twin")) return "tlr";
  if (lower.includes("view") || lower.includes("large format")) return "view";
  return "slr"; // Default for Lensfun data
}

/**
 * Default frame count by format.
 */
function defaultFrameCount(format: string): number {
  switch (format) {
    case "35mm": return 36;
    case "120": return 12;
    case "4x5": return 1;
    case "8x10": return 1;
    case "instant": return 1;
    default: return 36;
  }
}

export function transformCamera(raw: RawLensfunCamera): CameraStockOutput {
  const make = normalizeBrand(raw.maker);
  const name = raw.model;
  const mount = normalizeMount(raw.mount);
  const format = formatFromCropFactor(raw.cropfactor, mount);

  return {
    id: makeId(make, name),
    make,
    name,
    mount: mount as CameraStockOutput["mount"],
    format: format as CameraStockOutput["format"],
    default_frame_count: defaultFrameCount(format),
    type: inferCameraType(name, mount) as CameraStockOutput["type"],
  };
}

export function transformLens(raw: RawLensfunLens): LensStockOutput {
  const make = normalizeBrand(raw.maker);
  const name = raw.model;
  const mount = normalizeMount(raw.mount);

  if (raw.focalMin <= 0) {
    throw new Error(`Invalid focal length: ${raw.focalMin}`);
  }
  if (raw.apertureMin <= 0) {
    throw new Error(`Invalid aperture: ${raw.apertureMin}`);
  }

  return {
    id: makeId(make, name),
    make,
    name,
    mount: mount as LensStockOutput["mount"],
    focal_length: raw.focalMin,
    max_aperture: raw.apertureMin,
    focal_length_max: raw.focalMax,
    min_aperture: raw.apertureMax,
  };
}

export function transformMount(raw: RawLensfunMount): MountStockOutput {
  const name = raw.name;
  const id = makeId("mount", name);

  // Map compatible mounts (keeping raw Lensfun names for the mount table)
  const compatible = raw.compat.filter((c) => c !== name);

  return {
    id,
    name,
    type: name.toLowerCase().includes("thread") || name.includes("M42") || name.includes("M39")
      ? "thread"
      : "bayonet",
    register_distance: null, // Populated by Cornell mounts scraper
    mount_diameter: null,
    compatible_mounts: compatible,
    format: inferMountFormat(name) as MountStockOutput["format"],
  };
}
