import Dexie, { type EntityTable } from "dexie";
import type {
  Camera,
  Lens,
  Film,
  Roll,
  Frame,
  FilmStock,
  CameraStock,
  LensStock,
  SyncQueueItem,
  SyncMeta,
  SyncConflict,
} from "./types";

export class ArgentDb extends Dexie {
  cameras!: EntityTable<Camera, "id">;
  lenses!: EntityTable<Lens, "id">;
  films!: EntityTable<Film, "id">;
  rolls!: EntityTable<Roll, "id">;
  frames!: EntityTable<Frame, "id">;
  filmStock!: EntityTable<FilmStock, "id">;
  cameraStock!: EntityTable<CameraStock, "id">;
  lensStock!: EntityTable<LensStock, "id">;
  _syncQueue!: EntityTable<SyncQueueItem, "id">;
  _syncMeta!: EntityTable<SyncMeta, "key">;
  _syncConflicts!: EntityTable<SyncConflict, "id">;

  constructor() {
    super("argent");

    this.version(1).stores({
      cameras:
        "&id, user_id, format, [user_id+deleted_at], updated_at",
      lenses:
        "&id, user_id, camera_id, [user_id+deleted_at], updated_at",
      films:
        "&id, user_id, brand, format, process, is_custom, [user_id+deleted_at], updated_at",
      rolls:
        "&id, user_id, camera_id, film_id, status, [user_id+status], [user_id+deleted_at], updated_at",
      frames:
        "&id, roll_id, frame_number, [roll_id+frame_number], updated_at",
      filmStock:
        "&id, brand, name, iso, format, process",
      _syncQueue:
        "++id, table, entity_id, operation, status, retry_count, last_attempt",
      _syncMeta: "&key",
    });

    this.version(2).stores({
      cameraStock: "&id, make, name, mount, format, type",
      lensStock: "&id, make, name, mount, focal_length, max_aperture",
    });

    this.version(3).stores({
      _syncConflicts: "++id, table, entity_id",
    });
  }
}

/** Singleton database instance */
export const db = new ArgentDb();
