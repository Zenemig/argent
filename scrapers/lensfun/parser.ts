import { XMLParser } from "fast-xml-parser";

export type RawLensfunCamera = {
  maker: string;
  model: string;
  mount: string;
  cropfactor: number;
  variants: string[];
};

export type RawLensfunLens = {
  maker: string;
  model: string;
  mount: string;
  cropfactor: number;
  focalMin: number;
  focalMax: number | null;
  apertureMin: number;
  apertureMax: number | null;
  type: string;
};

export type RawLensfunMount = {
  name: string;
  compat: string[];
};

type ParsedResult = {
  cameras: RawLensfunCamera[];
  lenses: RawLensfunLens[];
  mounts: RawLensfunMount[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["camera", "lens", "mount", "model", "variant", "compat"].includes(name),
});

export function parseLensfunXml(xmlFiles: string[]): ParsedResult {
  const cameras: RawLensfunCamera[] = [];
  const lenses: RawLensfunLens[] = [];
  const mounts: RawLensfunMount[] = [];

  for (const xml of xmlFiles) {
    let parsed: Record<string, unknown>;
    try {
      parsed = parser.parse(xml);
    } catch {
      continue; // Skip malformed XML
    }

    const db = parsed["lensdatabase"] as Record<string, unknown> | undefined;
    if (!db) continue;

    // --- Mounts ---
    const rawMounts = asArray(db["mount"]);
    for (const m of rawMounts) {
      if (!m || typeof m !== "object") continue;
      const rec = m as Record<string, unknown>;
      const name = str(rec["name"]);
      if (!name) continue;
      const compat = asArray(rec["compat"]).map((c) => (typeof c === "string" ? c : "")).filter(Boolean);
      mounts.push({ name, compat });
    }

    // --- Cameras ---
    const rawCams = asArray(db["camera"]);
    for (const c of rawCams) {
      if (!c || typeof c !== "object") continue;
      const rec = c as Record<string, unknown>;
      const maker = str(rec["maker"]);
      const model = str(rec["model"]);
      const mount = str(rec["mount"]);
      if (!maker || !model) continue;

      const cropfactor = parseFloat(String(rec["cropfactor"] ?? "1"));
      const variants = asArray(rec["variant"]).map((v) => (typeof v === "string" ? v : "")).filter(Boolean);

      cameras.push({ maker, model, mount, cropfactor: isNaN(cropfactor) ? 1 : cropfactor, variants });
    }

    // --- Lenses ---
    const rawLenses = asArray(db["lens"]);
    for (const l of rawLenses) {
      if (!l || typeof l !== "object") continue;
      const rec = l as Record<string, unknown>;
      const maker = str(rec["maker"]);
      const model = str(rec["model"]);
      const mount = str(rec["mount"]);
      if (!maker || !model) continue;

      const cropfactor = parseFloat(String(rec["cropfactor"] ?? "1"));
      const type = str(rec["type"]) || "rectilinear";

      // Parse focal length and aperture from calibration or attributes
      const { focalMin, focalMax, apertureMin, apertureMax } = parseLensSpecs(rec);

      lenses.push({
        maker,
        model,
        mount,
        cropfactor: isNaN(cropfactor) ? 1 : cropfactor,
        focalMin,
        focalMax,
        apertureMin,
        apertureMax,
        type,
      });
    }
  }

  return { cameras, lenses, mounts };
}

/**
 * Extract focal length and aperture from Lensfun lens calibration data.
 * Falls back to parsing from the model name.
 */
function parseLensSpecs(lens: Record<string, unknown>): {
  focalMin: number;
  focalMax: number | null;
  apertureMin: number;
  apertureMax: number | null;
} {
  let focalMin = 0;
  let focalMax: number | null = null;
  let apertureMin = 0;
  let apertureMax: number | null = null;

  // Try calibration data first
  const calibration = lens["calibration"] as Record<string, unknown> | undefined;
  if (calibration) {
    // Distortion entries often have focal="50" attributes
    const distortion = asArray(calibration["distortion"]);
    const focals: number[] = [];
    for (const d of distortion) {
      if (d && typeof d === "object") {
        const f = parseFloat(String((d as Record<string, unknown>)["@_focal"] ?? "0"));
        if (f > 0) focals.push(f);
      }
    }
    if (focals.length > 0) {
      focalMin = Math.min(...focals);
      const maxF = Math.max(...focals);
      if (maxF > focalMin) focalMax = maxF;
    }
  }

  // Fallback: parse from model name
  if (focalMin === 0) {
    const model = str(lens["model"]) || "";
    const focalMatch = model.match(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*mm/i);
    if (focalMatch) {
      focalMin = parseFloat(focalMatch[1]);
      if (focalMatch[2]) focalMax = parseFloat(focalMatch[2]);
    }
    const aperMatch = model.match(/f\/?(\d+(?:\.\d+)?)/i);
    if (aperMatch) apertureMin = parseFloat(aperMatch[1]);
  }

  // Try aperture from model name if not found
  if (apertureMin === 0) {
    const model = str(lens["model"]) || "";
    const aperMatch = model.match(/f\/?(\d+(?:\.\d+)?)/i);
    if (aperMatch) apertureMin = parseFloat(aperMatch[1]);
  }

  // Check for zoom aperture range (e.g., "f/3.5-5.6")
  if (apertureMax === null) {
    const model = str(lens["model"]) || "";
    const zoomAperMatch = model.match(/f\/?(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/i);
    if (zoomAperMatch) {
      apertureMin = parseFloat(zoomAperMatch[1]);
      apertureMax = parseFloat(zoomAperMatch[2]);
    }
  }

  return { focalMin, focalMax, apertureMin, apertureMax };
}

function asArray(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  if (val === undefined || val === null) return [];
  return [val];
}

function str(val: unknown): string {
  if (typeof val === "string") return val.trim();
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") return val[0].trim();
  return "";
}
