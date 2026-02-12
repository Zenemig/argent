import { z } from "zod";

// Mirror enums from lib/constants.ts (scrapers can't import app code at runtime)
const FILM_FORMATS = ["35mm", "120", "4x5", "8x10", "instant", "other"] as const;
const FILM_PROCESSES = ["C-41", "E-6", "BW", "BW-C41", "other"] as const;
const LENS_MOUNTS = [
  "Nikon F", "Canon FD", "Canon EF", "Pentax K", "M42", "Olympus OM",
  "Minolta MD/MC", "Leica M", "Leica R", "Contax/Yashica", "Contax G",
  "Hasselblad V", "Mamiya RB/RZ67", "Mamiya 645", "Mamiya 7",
  "Pentax 67", "Pentax 645", "Voigtlander VM", "Fuji GX", "fixed", "other",
] as const;
const CAMERA_TYPES = [
  "slr", "rangefinder", "tlr", "point-and-shoot", "view", "medium-format-slr", "other",
] as const;

// ---------------------------------------------------------------------------
// Film Stock (expanded with new fields)
// ---------------------------------------------------------------------------

export const filmStockOutputSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1),
  name: z.string().min(1),
  iso: z.number().int().positive(),
  format: z.array(z.enum(FILM_FORMATS)).min(1),
  process: z.enum(FILM_PROCESSES),
  discontinued: z.boolean(),
  edge_code: z.string().nullable(),
  notch_code: z.string().nullable(),
  dx_code: z.string().nullable(),
  country: z.string().nullable(),
});

export type FilmStockOutput = z.infer<typeof filmStockOutputSchema>;

// ---------------------------------------------------------------------------
// Camera Stock
// ---------------------------------------------------------------------------

export const cameraStockOutputSchema = z.object({
  id: z.string().min(1),
  make: z.string().min(1),
  name: z.string().min(1),
  mount: z.enum(LENS_MOUNTS),
  format: z.enum(FILM_FORMATS),
  default_frame_count: z.number().int().positive(),
  type: z.enum(CAMERA_TYPES),
});

export type CameraStockOutput = z.infer<typeof cameraStockOutputSchema>;

// ---------------------------------------------------------------------------
// Lens Stock
// ---------------------------------------------------------------------------

export const lensStockOutputSchema = z.object({
  id: z.string().min(1),
  make: z.string().min(1),
  name: z.string().min(1),
  mount: z.enum(LENS_MOUNTS),
  focal_length: z.number().positive(),
  max_aperture: z.number().positive(),
  focal_length_max: z.number().positive().nullable().optional(),
  min_aperture: z.number().positive().nullable().optional(),
});

export type LensStockOutput = z.infer<typeof lensStockOutputSchema>;

// ---------------------------------------------------------------------------
// Mount Stock (NEW)
// ---------------------------------------------------------------------------

export const mountStockOutputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1), // Freeform string — not constrained to LENS_MOUNTS
  type: z.enum(["bayonet", "breech-lock", "thread", "other"]),
  register_distance: z.number().positive().nullable(),
  mount_diameter: z.number().positive().nullable(),
  compatible_mounts: z.array(z.string()),
  format: z.enum(FILM_FORMATS),
});

export type MountStockOutput = z.infer<typeof mountStockOutputSchema>;

// ---------------------------------------------------------------------------
// Scraper result wrapper
// ---------------------------------------------------------------------------

export type ScraperStats = {
  fetched: number;
  parsed: number;
  validated: number;
  failed: number;
};

export type ScraperResult<T> = {
  success: boolean;
  data: T[];
  errors: string[];
  stats: ScraperStats;
};
