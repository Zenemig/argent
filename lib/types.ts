/**
 * Types are derived from Zod schemas in lib/schemas.ts.
 * Re-exported here for convenience and for types that don't have a schema.
 */

export type {
  Camera,
  Lens,
  Film,
  Roll,
  Frame,
  FilmStock,
  CameraStock,
  LensStock,
  MountStock,
  SyncQueueItem,
  SyncMeta,
  SyncConflict,
  UserProfile,
} from "./schemas";

export type {
  FilmFormat,
  FilmProcess,
  RollStatus,
  MeteringMode,
  ShutterSpeed,
  Aperture,
  UserTier,
  SyncOperation,
  SyncStatus,
  SyncableTable,
  LensMount,
  CameraType,
} from "./constants";

/** Create-input type: omits server-managed fields */
export type CreateInput<T> = Omit<T, "id" | "created_at" | "updated_at">;

/** Update-input type: only id is required, rest optional */
export type UpdateInput<T extends { id: string }> = Pick<T, "id"> &
  Partial<Omit<T, "id">>;
