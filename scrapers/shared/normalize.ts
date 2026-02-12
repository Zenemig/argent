/**
 * Normalization maps for brand names, film formats, mount names, and processes.
 * These grow as edge cases are discovered during scraping.
 */

// ---------------------------------------------------------------------------
// Brand names
// ---------------------------------------------------------------------------

const BRAND_MAP: Record<string, string> = {
  "Eastman Kodak": "Kodak",
  "Eastman Kodak Company": "Kodak",
  "Kodak Alaris": "Kodak",
  "Fuji": "Fujifilm",
  "FUJIFILM": "Fujifilm",
  "Fuji Photo Film": "Fujifilm",
  "Fuji Photo Film Co.": "Fujifilm",
  "Agfa-Gevaert": "Agfa",
  "Ilford Photo": "Ilford",
  "ILFORD": "Ilford",
  "KMZ": "KMZ (Krasnogorsk)",
  "Krasnogorsky Zavod": "KMZ (Krasnogorsk)",
  // Lensfun-specific maker normalizations
  "NIKON CORPORATION": "Nikon",
  "Nikon Corporation": "Nikon",
  "OLYMPUS CORPORATION": "Olympus",
  "OLYMPUS IMAGING CORP.": "Olympus",
  "PENTAX Corporation": "Pentax",
  "PENTAX": "Pentax",
  "SIGMA": "Sigma",
  "TAMRON": "Tamron",
  "Carl Zeiss": "Carl Zeiss",
  "Carl Zeiss Jena": "Carl Zeiss Jena",
  "Voigtländer": "Voigtlander",
  "VOIGTLAENDER": "Voigtlander",
  "Cosina Voigtländer": "Voigtlander",
};

export function normalizeBrand(raw: string): string {
  const trimmed = raw.trim();
  return BRAND_MAP[trimmed] ?? trimmed;
}

// ---------------------------------------------------------------------------
// Film formats
// ---------------------------------------------------------------------------

const FORMAT_MAP: Record<string, string> = {
  "135": "35mm",
  "35mm": "35mm",
  "35 mm": "35mm",
  "35mm film": "35mm",
  "120 film": "120",
  "220": "120",
  "620": "120",
  "4×5": "4x5",
  "4 × 5": "4x5",
  "4x5 inch": "4x5",
  "5×4": "4x5",
  "8×10": "8x10",
  "8 × 10": "8x10",
  "8x10 inch": "8x10",
  "110": "other",
  "127": "other",
  "disc": "other",
  "APS": "other",
  "Minox": "other",
  "instant film": "instant",
  "sheet film": "4x5",
  "sheet": "4x5",
};

export function normalizeFormat(raw: string): string {
  const trimmed = raw.trim();
  // Strip leading Wikipedia reference markers like "[68] "
  const cleaned = trimmed.replace(/^\[\d+\]\s*/, "");
  if (FORMAT_MAP[cleaned]) return FORMAT_MAP[cleaned];
  if (FORMAT_MAP[cleaned.toLowerCase()]) return FORMAT_MAP[cleaned.toLowerCase()];
  // Handle "135-24", "135-36" → "35mm"
  if (/^135\b/.test(cleaned)) return "35mm";
  // Handle "120-" variants and 620 (same backing paper as 120)
  if (/^120\b/.test(cleaned)) return "120";
  if (/^220\b/.test(cleaned)) return "120";
  if (/^620\b/.test(cleaned)) return "120";
  // Handle 4x5" and 4x5 variants (including sheet counts)
  if (/4\s*x\s*5/i.test(cleaned)) return "4x5";
  if (/5\s*x\s*4/i.test(cleaned)) return "4x5";
  // Handle 5x7" → "other" (not in our enum but valid large format)
  if (/5\s*x\s*7/i.test(cleaned)) return "other";
  // Handle 8x10" variants (including sheet counts)
  if (/8\s*x\s*10/i.test(cleaned)) return "8x10";
  // Handle 16mm, 110, misc film/movie formats → "other"
  if (/^16mm/i.test(cleaned)) return "other";
  if (/^110\b/.test(cleaned)) return "other";
  // Handle pure numbers (exposure counts like "24", "36") — skip these
  if (/^\d+$/.test(cleaned)) return "";
  // Handle sheet film mentions
  if (/sheet/i.test(cleaned)) return "4x5";
  // Anything with "ft" or "m" (bulk rolls) → "other"
  if (/\d+\s*(ft|m)\b/i.test(cleaned)) return "other";
  // Anything with "mm" dimensions → "other"
  if (/\d+\s*mm/i.test(cleaned)) return "other";
  // SUC (single-use camera) → "other"
  if (/^SUC/i.test(cleaned)) return "other";
  // If nothing matched, return "other"
  return "other";
}

/**
 * Parse a format string that may contain multiple formats separated by commas,
 * slashes, or listed individually. Returns deduplicated array of format values.
 */
export function parseFormats(raw: string): string[] {
  const seen = new Set<string>();
  // Split on comma, slash, or semicolon
  const parts = raw.split(/[,/;]/).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const normalized = normalizeFormat(part);
    if (normalized) seen.add(normalized);
  }
  return [...seen];
}

// ---------------------------------------------------------------------------
// Film processes
// ---------------------------------------------------------------------------

export function normalizeProcess(raw: string): string {
  const upper = raw.toUpperCase().trim();
  // Check chromogenic BW first (contains both B&W and C-41 indicators)
  const isBw = upper.includes("B&W") || upper.includes("B+W") || upper.includes("BLACK") ||
      upper === "BW" || upper === "B/W" || upper === "MONOCHROME" ||
      upper === "BLACK-AND-WHITE" || upper === "BLACK AND WHITE";
  const isChromogenic = upper.includes("C-41") || upper.includes("C41") || upper.includes("CHROMOGENIC");
  if (isBw && isChromogenic) return "BW-C41";
  if (isBw) return "BW";
  if (isChromogenic || upper === "COLOR NEGATIVE" || upper === "CN" ||
      upper === "COLOR NEG") return "C-41";
  if (upper.includes("E-6") || upper === "COLOR REVERSAL" || upper === "SLIDE" ||
      upper === "E6" || upper === "COLOR REV") return "E-6";
  if (upper === "ECN-2" || upper === "ECN2" || upper === "INSTANT" || upper === "K-14") return "other";
  return "other";
}

// ---------------------------------------------------------------------------
// Lens mounts — map to the 20 curated values in LENS_MOUNTS
// ---------------------------------------------------------------------------

const CURATED_MOUNTS = new Set([
  "Nikon F", "Canon FD", "Canon EF", "Pentax K", "M42", "Olympus OM",
  "Minolta MD/MC", "Leica M", "Leica R", "Contax/Yashica", "Contax G",
  "Hasselblad V", "Mamiya RB/RZ67", "Mamiya 645", "Mamiya 7",
  "Pentax 67", "Pentax 645", "Voigtlander VM", "Fuji GX", "fixed", "other",
]);

const MOUNT_MAP: Record<string, string> = {
  // Lensfun mount names → curated names
  "Nikon F AF": "Nikon F",
  "Nikon F AI-S": "Nikon F",
  "Nikon F AI": "Nikon F",
  "Nikon F": "Nikon F",
  "Canon FD": "Canon FD",
  "Canon EF": "Canon EF",
  "Canon EF-S": "Canon EF",
  "Pentax K": "Pentax K",
  "Pentax KA": "Pentax K",
  "Pentax KAF": "Pentax K",
  "Pentax KAF2": "Pentax K",
  "M42": "M42",
  "Olympus OM": "Olympus OM",
  "Minolta MD": "Minolta MD/MC",
  "Minolta MC": "Minolta MD/MC",
  "Minolta MD/MC": "Minolta MD/MC",
  "Minolta AF": "other",
  "Leica M": "Leica M",
  "Leica R": "Leica R",
  "Contax/Yashica": "Contax/Yashica",
  "C/Y": "Contax/Yashica",
  "Contax G": "Contax G",
  "Hasselblad V": "Hasselblad V",
  "Mamiya RB67": "Mamiya RB/RZ67",
  "Mamiya RZ67": "Mamiya RB/RZ67",
  "Mamiya 645": "Mamiya 645",
  "Mamiya 7": "Mamiya 7",
  "Pentax 67": "Pentax 67",
  "Pentax 645": "Pentax 645",
  "Pentax 645AF": "Pentax 645",
  "Pentax 645AF2": "Pentax 645",
  "Voigtlander VM": "Voigtlander VM",
  "Fuji GX": "Fuji GX",
  "Generic": "other",
  // Cornell / Wikipedia variants
  "Nikon F-mount": "Nikon F",
  "Canon FD mount": "Canon FD",
  "Canon EF mount": "Canon EF",
  "Pentax K-mount": "Pentax K",
  "M42 screw mount": "M42",
  "Olympus OM mount": "Olympus OM",
  "Leica M-mount": "Leica M",
  "Leica R-mount": "Leica R",
};

/**
 * Map a raw mount name to one of the 20 curated LENS_MOUNTS values.
 * Unknown mounts map to "other".
 */
export function normalizeMount(raw: string): string {
  const trimmed = raw.trim();
  if (CURATED_MOUNTS.has(trimmed)) return trimmed;
  return MOUNT_MAP[trimmed] ?? "other";
}

/**
 * Generate a URL-safe kebab-case ID from brand + name.
 */
export function makeId(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Shared parser/transformer utilities
// ---------------------------------------------------------------------------

/**
 * Find a column index by checking header text against candidate strings.
 */
export function findCol(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Create a normalized lookup key from brand + name for fuzzy matching.
 */
export function matchKey(brand: string, name: string): string {
  return `${brand}|${name}`.toLowerCase().replace(/\s+/g, "");
}

/**
 * Fuzzy name matching: checks if either name contains the other
 * after stripping non-alphanumeric characters.
 */
export function fuzzyNameMatch(filmName: string, entryName: string): boolean {
  const a = filmName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const b = entryName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return a.includes(b) || b.includes(a);
}

/**
 * Infer film format from mount name keywords.
 */
export function inferMountFormat(mount: string): string {
  const lower = mount.toLowerCase();
  if (lower.includes("645") || lower.includes("67") || lower.includes("hasselblad") ||
      lower.includes("mamiya") || lower.includes("bronica") || lower.includes("medium")) {
    return "120";
  }
  if (lower.includes("4x5") || lower.includes("large format")) return "4x5";
  return "35mm";
}
