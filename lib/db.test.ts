import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { ArgentDb } from "./db";
import { filmStocks, seedFilmStocks } from "./seed";
import { filmStockSchema } from "./schemas";
import { ulid } from "ulid";

let db: ArgentDb;

beforeEach(async () => {
  db = new ArgentDb();
  // Clear all tables between tests
  await db.delete();
  db = new ArgentDb();
});

describe("ArgentDb", () => {
  it("opens without error", async () => {
    await db.open();
    expect(db.isOpen()).toBe(true);
  });

  it("has all expected tables", () => {
    const tableNames = db.tables.map((t) => t.name).sort();
    expect(tableNames).toEqual(
      [
        "_syncConflicts",
        "_syncMeta",
        "_syncQueue",
        "cameraStock",
        "cameras",
        "films",
        "filmStock",
        "frames",
        "lensStock",
        "lenses",
        "rolls",
      ].sort(),
    );
  });
});

describe("CRUD operations", () => {
  it("creates and reads a camera", async () => {
    const now = Date.now();
    const camera = {
      id: ulid(),
      user_id: "test-user",
      name: "Nikon FM2",
      make: "Nikon",
      format: "35mm" as const,
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: now,
      created_at: now,
    };

    await db.cameras.add(camera);
    const found = await db.cameras.get(camera.id);
    expect(found?.name).toBe("Nikon FM2");
  });

  it("creates and reads a frame", async () => {
    const now = Date.now();
    const rollId = ulid();
    const frame = {
      id: ulid(),
      roll_id: rollId,
      frame_number: 1,
      shutter_speed: "1/125",
      aperture: 5.6,
      lens_id: null,
      metering_mode: "spot" as const,
      exposure_comp: 0,
      filter: null,
      latitude: null,
      longitude: null,
      location_name: null,
      notes: "Test shot",
      thumbnail: null,
      image_url: null,
      captured_at: now,
      updated_at: now,
      created_at: now,
    };

    await db.frames.add(frame);
    const found = await db.frames.get(frame.id);
    expect(found?.notes).toBe("Test shot");
  });

  it("queries frames by roll_id", async () => {
    const now = Date.now();
    const rollA = ulid();
    const rollB = ulid();

    await db.frames.bulkAdd([
      {
        id: ulid(), roll_id: rollA, frame_number: 1,
        shutter_speed: "1/60", aperture: 8,
        captured_at: now, updated_at: now, created_at: now,
      },
      {
        id: ulid(), roll_id: rollA, frame_number: 2,
        shutter_speed: "1/125", aperture: 5.6,
        captured_at: now, updated_at: now, created_at: now,
      },
      {
        id: ulid(), roll_id: rollB, frame_number: 1,
        shutter_speed: "1/250", aperture: 4,
        captured_at: now, updated_at: now, created_at: now,
      },
    ]);

    const rollAFrames = await db.frames.where("roll_id").equals(rollA).toArray();
    expect(rollAFrames).toHaveLength(2);
  });

  it("soft-deletes a camera", async () => {
    const now = Date.now();
    const camera = {
      id: ulid(),
      user_id: "test-user",
      name: "To Delete",
      make: "Test",
      format: "35mm" as const,
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: now,
      created_at: now,
    };

    await db.cameras.add(camera);
    await db.cameras.update(camera.id, { deleted_at: Date.now() });
    const found = await db.cameras.get(camera.id);
    expect(found?.deleted_at).not.toBeNull();
  });
});

describe("Film stock seed data", () => {
  it("contains 80+ stocks", () => {
    expect(filmStocks.length).toBeGreaterThanOrEqual(80);
  });

  it("all stocks pass schema validation", () => {
    for (const stock of filmStocks) {
      const result = filmStockSchema.safeParse(stock);
      if (!result.success) {
        throw new Error(
          `Invalid stock ${stock.id}: ${JSON.stringify(result.error.issues)}`,
        );
      }
    }
  });

  it("all stock IDs are unique", () => {
    const ids = filmStocks.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("seeds data into the database", async () => {
    await seedFilmStocks(db.filmStock);
    const count = await db.filmStock.count();
    expect(count).toBe(filmStocks.length);
  });

  it("seed is idempotent (bulkPut overwrites)", async () => {
    await seedFilmStocks(db.filmStock);
    await seedFilmStocks(db.filmStock);
    const count = await db.filmStock.count();
    expect(count).toBe(filmStocks.length);
  });

  it("includes major brands", () => {
    const brands = new Set(filmStocks.map((s) => s.brand));
    for (const expected of [
      "Kodak",
      "Fujifilm",
      "Ilford",
      "CineStill",
      "Lomography",
      "Fomapan",
    ]) {
      expect(brands.has(expected)).toBe(true);
    }
  });

  it("includes all process types", () => {
    const processes = new Set(filmStocks.map((s) => s.process));
    expect(processes.has("C-41")).toBe(true);
    expect(processes.has("E-6")).toBe(true);
    expect(processes.has("BW")).toBe(true);
    expect(processes.has("BW-C41")).toBe(true);
  });
});
