/** Film format types */
export const FILM_FORMATS = ["35mm", "120", "4x5", "8x10", "instant", "other"] as const;
export type FilmFormat = (typeof FILM_FORMATS)[number];

/** Film development process types */
export const FILM_PROCESSES = ["C-41", "E-6", "BW", "BW-C41", "other"] as const;
export type FilmProcess = (typeof FILM_PROCESSES)[number];

/** Roll lifecycle statuses (ordered) */
export const ROLL_STATUSES = [
  "loaded",
  "active",
  "finished",
  "developed",
  "scanned",
  "archived",
] as const;
export type RollStatus = (typeof ROLL_STATUSES)[number];

/** Metering modes */
export const METERING_MODES = [
  "spot",
  "center",
  "matrix",
  "incident",
  "sunny16",
] as const;
export type MeteringMode = (typeof METERING_MODES)[number];

/** Common shutter speeds (displayed as strings for UX, e.g. "1/125") */
export const SHUTTER_SPEEDS = [
  "B",
  "30s",
  "15s",
  "8s",
  "4s",
  "2s",
  "1s",
  "1/2",
  "1/4",
  "1/8",
  "1/15",
  "1/30",
  "1/60",
  "1/125",
  "1/250",
  "1/500",
  "1/1000",
  "1/2000",
  "1/4000",
  "1/8000",
] as const;
export type ShutterSpeed = (typeof SHUTTER_SPEEDS)[number];

/** Common f-stop values */
export const APERTURES = [
  0.95, 1, 1.2, 1.4, 1.8, 2, 2.5, 2.8, 3.5, 4, 4.5, 5.6, 6.3, 8, 9.5, 11,
  13, 16, 19, 22, 32, 45, 64,
] as const;
export type Aperture = (typeof APERTURES)[number];

/** Common EV compensation values */
export const EXPOSURE_COMP_VALUES = [
  -3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3,
] as const;

/** Default frame counts by film format */
export const DEFAULT_FRAME_COUNTS: Record<FilmFormat, number> = {
  "35mm": 36,
  "120": 12,
  "4x5": 1,
  "8x10": 1,
  instant: 1,
  other: 36,
};

/** User tiers */
export const USER_TIERS = ["guest", "free", "pro"] as const;
export type UserTier = (typeof USER_TIERS)[number];

/** Lens mount types */
export const LENS_MOUNTS = [
  "Nikon F",
  "Canon FD",
  "Canon EF",
  "Pentax K",
  "M42",
  "Olympus OM",
  "Minolta MD/MC",
  "Leica M",
  "Leica R",
  "Contax/Yashica",
  "Contax G",
  "Hasselblad V",
  "Mamiya RB/RZ67",
  "Mamiya 645",
  "Mamiya 7",
  "Pentax 67",
  "Pentax 645",
  "Voigtlander VM",
  "Fuji GX",
  "fixed",
  "other",
] as const;
export type LensMount = (typeof LENS_MOUNTS)[number];

/** Camera body types */
export const CAMERA_TYPES = [
  "slr",
  "rangefinder",
  "tlr",
  "point-and-shoot",
  "view",
  "medium-format-slr",
  "other",
] as const;
export type CameraType = (typeof CAMERA_TYPES)[number];

/** Sync queue operation types */
export const SYNC_OPERATIONS = ["create", "update", "delete"] as const;
export type SyncOperation = (typeof SYNC_OPERATIONS)[number];

/** Sync queue item statuses */
export const SYNC_STATUSES = ["pending", "in_progress", "failed"] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

/** Syncable table names */
export const SYNCABLE_TABLES = [
  "cameras",
  "lenses",
  "films",
  "rolls",
  "frames",
] as const;
export type SyncableTable = (typeof SYNCABLE_TABLES)[number];
