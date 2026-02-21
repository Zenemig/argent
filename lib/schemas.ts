import { z } from "zod";
import {
  FILM_FORMATS,
  FILM_PROCESSES,
  ROLL_STATUSES,
  METERING_MODES,
  SHUTTER_SPEEDS,
  SYNC_OPERATIONS,
  SYNC_STATUSES,
  SYNCABLE_TABLES,
  USER_TIERS,
  LENS_MOUNTS,
  CAMERA_TYPES,
  FEEDBACK_CATEGORIES,
} from "./constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "Invalid ULID");
const timestamp = z.number().int().positive();
const optionalTimestamp = z.number().int().positive().nullable().optional();

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export const cameraSchema = z.object({
  id: ulid,
  user_id: z.string().min(1),
  name: z.string().min(1).max(100),
  make: z.string().min(1).max(100),
  format: z.enum(FILM_FORMATS),
  mount: z.enum(LENS_MOUNTS).nullable().optional(),
  type: z.enum(CAMERA_TYPES).nullable().optional(),
  shutter_speed_min: z.enum(SHUTTER_SPEEDS).exclude(["B"]).nullable().optional(),
  shutter_speed_max: z.enum(SHUTTER_SPEEDS).exclude(["B"]).nullable().optional(),
  has_bulb: z.boolean().nullable().optional(),
  metering_modes: z.array(z.enum(METERING_MODES)).nullable().optional(),
  default_frame_count: z.number().int().positive(),
  notes: z.string().max(500).nullable().optional(),
  deleted_at: optionalTimestamp,
  updated_at: timestamp,
  created_at: timestamp,
});

export type Camera = z.infer<typeof cameraSchema>;

// ---------------------------------------------------------------------------
// Lens
// ---------------------------------------------------------------------------

export const lensSchema = z.object({
  id: ulid,
  user_id: z.string().min(1),
  camera_id: ulid.nullable().optional(),
  name: z.string().min(1).max(100),
  make: z.string().min(1).max(100),
  mount: z.enum(LENS_MOUNTS).nullable().optional(),
  focal_length: z.number().positive(),
  max_aperture: z.number().positive(),
  focal_length_max: z.number().positive().nullable().optional(),
  min_aperture: z.number().positive().nullable().optional(),
  aperture_min: z.number().positive().nullable().optional(),
  deleted_at: optionalTimestamp,
  updated_at: timestamp,
  created_at: timestamp,
});

export type Lens = z.infer<typeof lensSchema>;

// ---------------------------------------------------------------------------
// Film (user custom)
// ---------------------------------------------------------------------------

export const filmSchema = z.object({
  id: ulid,
  user_id: z.string().min(1),
  brand: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  iso: z.number().int().positive(),
  format: z.enum(FILM_FORMATS),
  process: z.enum(FILM_PROCESSES),
  is_custom: z.boolean(),
  deleted_at: optionalTimestamp,
  updated_at: timestamp,
  created_at: timestamp,
});

export type Film = z.infer<typeof filmSchema>;

// ---------------------------------------------------------------------------
// Roll
// ---------------------------------------------------------------------------

export const rollSchema = z.object({
  id: ulid,
  user_id: z.string().min(1),
  camera_id: ulid,
  film_id: ulid,
  lens_id: ulid.nullable().optional(),
  status: z.enum(ROLL_STATUSES),
  frame_count: z.number().int().positive(),
  ei: z.number().int().positive(),
  push_pull: z.number(),
  lab_name: z.string().max(200).nullable().optional(),
  dev_notes: z.string().max(500).nullable().optional(),
  discard_reason: z.string().max(100).nullable().optional(),
  discard_notes: z.string().max(500).nullable().optional(),
  start_date: timestamp,
  finish_date: optionalTimestamp,
  develop_date: optionalTimestamp,
  scan_date: optionalTimestamp,
  notes: z.string().max(500).nullable().optional(),
  deleted_at: optionalTimestamp,
  updated_at: timestamp,
  created_at: timestamp,
});

export type Roll = z.infer<typeof rollSchema>;

// ---------------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------------

export const frameSchema = z.object({
  id: ulid,
  roll_id: ulid,
  frame_number: z.number().int().positive(),
  shutter_speed: z.string().min(1).max(20),
  aperture: z.number().positive(),
  lens_id: ulid.nullable().optional(),
  metering_mode: z.enum(METERING_MODES).nullable().optional(),
  exposure_comp: z.number().nullable().optional(),
  filter: z.string().max(100).nullable().optional(),
  focal_length: z.number().positive().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  location_name: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  thumbnail: z.any().nullable().optional(),
  image_url: z.string().nullable().optional(),
  captured_at: timestamp,
  deleted_at: optionalTimestamp,
  updated_at: timestamp,
  created_at: timestamp,
});

export type Frame = z.infer<typeof frameSchema>;

// ---------------------------------------------------------------------------
// Film Stock (seed data, read-only catalog)
// ---------------------------------------------------------------------------

export const filmStockSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1),
  name: z.string().min(1),
  iso: z.number().int().positive(),
  format: z.array(z.enum(FILM_FORMATS)),
  process: z.enum(FILM_PROCESSES),
  discontinued: z.boolean().optional(),
  edge_code: z.string().nullable().optional(),
  notch_code: z.string().nullable().optional(),
  dx_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

export type FilmStock = z.infer<typeof filmStockSchema>;

// ---------------------------------------------------------------------------
// Sync Queue
// ---------------------------------------------------------------------------

export const syncQueueItemSchema = z.object({
  id: z.number().int().positive().optional(), // auto-incremented
  table: z.enum(SYNCABLE_TABLES),
  entity_id: ulid,
  operation: z.enum(SYNC_OPERATIONS),
  status: z.enum(SYNC_STATUSES),
  retry_count: z.number().int().nonnegative(),
  last_attempt: optionalTimestamp,
  payload: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type SyncQueueItem = z.infer<typeof syncQueueItemSchema>;

// ---------------------------------------------------------------------------
// Sync Meta
// ---------------------------------------------------------------------------

export const syncMetaSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export type SyncMeta = z.infer<typeof syncMetaSchema>;

// ---------------------------------------------------------------------------
// Sync Conflict (logged when download overwrites local data with pending upload)
// ---------------------------------------------------------------------------

export const syncConflictSchema = z.object({
  id: z.number().int().positive().optional(), // auto-increment
  table: z.string().min(1),
  entity_id: z.string().min(1),
  local_data: z.record(z.string(), z.unknown()),
  server_data: z.record(z.string(), z.unknown()),
  resolved_by: z.enum(["server_wins"]),
  created_at: z.number().int().positive(),
});

export type SyncConflict = z.infer<typeof syncConflictSchema>;

// ---------------------------------------------------------------------------
// User Profile (stored in Supabase, cached locally)
// ---------------------------------------------------------------------------

export const userProfileSchema = z.object({
  id: z.string().min(1),
  tier: z.enum(USER_TIERS),
  display_name: z.string().max(100).nullable().optional(),
  copyright_notice: z.string().max(200).nullable().optional(),
  default_metering: z.enum(METERING_MODES).nullable().optional(),
  default_camera_id: ulid.nullable().optional(),
  avatar_url: z.string().max(500).nullable().optional(),
  updated_at: timestamp,
  created_at: timestamp,
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// ---------------------------------------------------------------------------
// Feedback Payload (client → API route)
// ---------------------------------------------------------------------------

export const feedbackPayloadSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  description: z.string().min(10).max(5000),
  includeEmail: z.boolean(),
  metadata: z.object({
    page: z.string(),
    userAgent: z.string(),
  }),
});

export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;
