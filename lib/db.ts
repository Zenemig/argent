import Dexie, { type EntityTable } from "dexie";
import type {
  Camera,
  Lens,
  Film,
  Roll,
  Frame,
  FilmStock,
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

    this.version(4).stores({
      mountStock: "&id, name, format",
    });

    this.version(5).stores({
      cameras:
        "&id, user_id, format, mount, type, [user_id+deleted_at], updated_at",
      lenses:
        "&id, user_id, camera_id, mount, [user_id+deleted_at], updated_at",
      cameraStock: null,
      lensStock: null,
      mountStock: null,
    });

    // v6: gear constraint fields (shutter_speed_min/max, metering_modes, aperture_min)
    // No new indexes — fields aren't queried by index
    this.version(6).stores({});

    // v7: add is_blank to frames, make shutter_speed/aperture nullable
    // No new indexes — is_blank is not queried by index
    this.version(7).stores({});
  }
}

/** Singleton database instance */
export const db = new ArgentDb();
