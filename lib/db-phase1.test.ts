import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { ArgentDb } from "./db";
import { seedFilmStocks } from "./seed";
import { ulid } from "ulid";
import type { RollStatus } from "./types";

let db: ArgentDb;

beforeEach(async () => {
  db = new ArgentDb();
  await db.delete();
  db = new ArgentDb();
});

describe("Camera queries", () => {
  const now = Date.now();
  const userId = "guest";

  it("creates a camera", async () => {
    const id = ulid();
    await db.cameras.add({
      id, user_id: userId, name: "Nikon F3", make: "Nikon",
      format: "35mm", default_frame_count: 36, notes: null,
      deleted_at: null, updated_at: now, created_at: now,
    });
    const found = await db.cameras.get(id);
    expect(found?.name).toBe("Nikon F3");
  });

  it("filters by user_id excluding soft-deleted", async () => {
    await db.cameras.bulkAdd([
      { id: ulid(), user_id: userId, name: "Active Cam", make: "X", format: "35mm", default_frame_count: 36, notes: null, deleted_at: null, updated_at: now, created_at: now },
      { id: ulid(), user_id: userId, name: "Deleted Cam", make: "X", format: "35mm", default_frame_count: 36, notes: null, deleted_at: now, updated_at: now, created_at: now },
      { id: ulid(), user_id: "other", name: "Other User", make: "X", format: "35mm", default_frame_count: 36, notes: null, deleted_at: null, updated_at: now, created_at: now },
    ]);

    const cameras = await db.cameras
      .where("user_id").equals(userId)
      .filter((c) => c.deleted_at === null || c.deleted_at === undefined)
      .toArray();

    expect(cameras).toHaveLength(1);
    expect(cameras[0].name).toBe("Active Cam");
  });

  it("updates a camera", async () => {
    const id = ulid();
    await db.cameras.add({
      id, user_id: userId, name: "Before", make: "X", format: "35mm",
      default_frame_count: 36, notes: null, deleted_at: null,
      updated_at: now, created_at: now,
    });
    await db.cameras.update(id, { name: "After", updated_at: Date.now() });
    const found = await db.cameras.get(id);
    expect(found?.name).toBe("After");
  });

  it("sorts by created_at", async () => {
    await db.cameras.bulkAdd([
      { id: ulid(), user_id: userId, name: "Second", make: "X", format: "35mm", default_frame_count: 36, notes: null, deleted_at: null, updated_at: now + 1, created_at: now + 1 },
      { id: ulid(), user_id: userId, name: "First", make: "X", format: "35mm", default_frame_count: 36, notes: null, deleted_at: null, updated_at: now, created_at: now },
    ]);

    // Dexie doesn't have created_at index, so we sort in JS
    const cameras = await db.cameras.where("user_id").equals(userId).toArray();
    cameras.sort((a, b) => a.created_at - b.created_at);
    expect(cameras[0].name).toBe("First");
    expect(cameras[1].name).toBe("Second");
  });
});

describe("Lens queries", () => {
  const now = Date.now();
  const userId = "guest";

  it("creates a lens linked to a camera", async () => {
    const camId = ulid();
    const lensId = ulid();
    await db.lenses.add({
      id: lensId, user_id: userId, camera_id: camId,
      name: "50mm f/1.4", make: "Nikon", focal_length: 50, max_aperture: 1.4,
      deleted_at: null, updated_at: now, created_at: now,
    });
    const found = await db.lenses.get(lensId);
    expect(found?.camera_id).toBe(camId);
  });

  it("creates a universal lens (camera_id=null)", async () => {
    const lensId = ulid();
    await db.lenses.add({
      id: lensId, user_id: userId, camera_id: null,
      name: "28mm f/2.8", make: "Voigtlander", focal_length: 28, max_aperture: 2.8,
      deleted_at: null, updated_at: now, created_at: now,
    });
    const found = await db.lenses.get(lensId);
    expect(found?.camera_id).toBeNull();
  });

  it("filters lenses by camera_id OR universal", async () => {
    const camA = ulid();
    const camB = ulid();
    await db.lenses.bulkAdd([
      { id: ulid(), user_id: userId, camera_id: camA, name: "CamA Lens", make: "X", focal_length: 50, max_aperture: 1.4, deleted_at: null, updated_at: now, created_at: now },
      { id: ulid(), user_id: userId, camera_id: camB, name: "CamB Lens", make: "X", focal_length: 35, max_aperture: 2.0, deleted_at: null, updated_at: now, created_at: now },
      { id: ulid(), user_id: userId, camera_id: null, name: "Universal", make: "X", focal_length: 28, max_aperture: 2.8, deleted_at: null, updated_at: now, created_at: now },
    ]);

    const lenses = await db.lenses
      .where("user_id").equals(userId)
      .filter((l) =>
        (l.deleted_at === null || l.deleted_at === undefined) &&
        (l.camera_id === null || l.camera_id === undefined || l.camera_id === camA)
      )
      .toArray();

    expect(lenses).toHaveLength(2);
    const names = lenses.map((l) => l.name).sort();
    expect(names).toEqual(["CamA Lens", "Universal"]);
  });
});

describe("Custom film queries", () => {
  const now = Date.now();
  const userId = "guest";

  it("creates a custom film with is_custom=true", async () => {
    const filmId = ulid();
    await db.films.add({
      id: filmId, user_id: userId, brand: "Custom", name: "Test Film",
      iso: 100, format: "35mm", process: "BW", is_custom: true,
      deleted_at: null, updated_at: now, created_at: now,
    });
    const found = await db.films.get(filmId);
    expect(found?.is_custom).toBe(true);
  });

  it("filters by format", async () => {
    await db.films.bulkAdd([
      { id: ulid(), user_id: userId, brand: "A", name: "35mm Film", iso: 400, format: "35mm", process: "C-41", is_custom: true, deleted_at: null, updated_at: now, created_at: now },
      { id: ulid(), user_id: userId, brand: "B", name: "120 Film", iso: 400, format: "120", process: "C-41", is_custom: true, deleted_at: null, updated_at: now, created_at: now },
    ]);

    const films35 = await db.films
      .where("user_id").equals(userId)
      .filter((f) => f.format === "35mm" && (f.deleted_at === null || f.deleted_at === undefined))
      .toArray();

    expect(films35).toHaveLength(1);
    expect(films35[0].name).toBe("35mm Film");
  });
});

describe("Roll queries", () => {
  const now = Date.now();
  const userId = "guest";

  it("creates a roll with loaded status", async () => {
    const rollId = ulid();
    await db.rolls.add({
      id: rollId, user_id: userId, camera_id: ulid(), film_id: ulid(),
      lens_id: null, status: "loaded", frame_count: 36, ei: 400, push_pull: 0,
      lab_name: null, dev_notes: null, start_date: now,
      finish_date: null, develop_date: null, scan_date: null,
      notes: null, deleted_at: null, updated_at: now, created_at: now,
    });
    const found = await db.rolls.get(rollId);
    expect(found?.status).toBe("loaded");
  });

  it("updates status to active", async () => {
    const rollId = ulid();
    await db.rolls.add({
      id: rollId, user_id: userId, camera_id: ulid(), film_id: ulid(),
      lens_id: null, status: "loaded", frame_count: 36, ei: 400, push_pull: 0,
      lab_name: null, dev_notes: null, start_date: now,
      finish_date: null, develop_date: null, scan_date: null,
      notes: null, deleted_at: null, updated_at: now, created_at: now,
    });
    await db.rolls.update(rollId, { status: "active" as RollStatus, updated_at: Date.now() });
    const found = await db.rolls.get(rollId);
    expect(found?.status).toBe("active");
  });

  it("queries rolls excluding soft-deleted", async () => {
    await db.rolls.bulkAdd([
      { id: ulid(), user_id: userId, camera_id: ulid(), film_id: ulid(), lens_id: null, status: "active", frame_count: 36, ei: 400, push_pull: 0, lab_name: null, dev_notes: null, start_date: now, finish_date: null, develop_date: null, scan_date: null, notes: null, deleted_at: null, updated_at: now, created_at: now },
      { id: ulid(), user_id: userId, camera_id: ulid(), film_id: ulid(), lens_id: null, status: "loaded", frame_count: 12, ei: 100, push_pull: 0, lab_name: null, dev_notes: null, start_date: now, finish_date: null, develop_date: null, scan_date: null, notes: null, deleted_at: now, updated_at: now, created_at: now },
    ]);

    const rolls = await db.rolls
      .where("user_id").equals(userId)
      .filter((r) => r.deleted_at === null || r.deleted_at === undefined)
      .toArray();

    expect(rolls).toHaveLength(1);
    expect(rolls[0].status).toBe("active");
  });
});

describe("Frame queries", () => {
  const now = Date.now();

  it("creates a frame", async () => {
    const frameId = ulid();
    const rollId = ulid();
    await db.frames.add({
      id: frameId, roll_id: rollId, frame_number: 1,
      shutter_speed: "1/125", aperture: 5.6,
      captured_at: now, updated_at: now, created_at: now,
    });
    const found = await db.frames.get(frameId);
    expect(found?.frame_number).toBe(1);
  });

  it("counts frames by roll_id", async () => {
    const rollA = ulid();
    const rollB = ulid();
    await db.frames.bulkAdd([
      { id: ulid(), roll_id: rollA, frame_number: 1, shutter_speed: "1/60", aperture: 8, captured_at: now, updated_at: now, created_at: now },
      { id: ulid(), roll_id: rollA, frame_number: 2, shutter_speed: "1/125", aperture: 5.6, captured_at: now, updated_at: now, created_at: now },
      { id: ulid(), roll_id: rollA, frame_number: 3, shutter_speed: "1/250", aperture: 4, captured_at: now, updated_at: now, created_at: now },
      { id: ulid(), roll_id: rollB, frame_number: 1, shutter_speed: "1/500", aperture: 2.8, captured_at: now, updated_at: now, created_at: now },
    ]);

    const count = await db.frames.where("roll_id").equals(rollA).count();
    expect(count).toBe(3);
  });

  it("sorts frames by frame_number within a roll", async () => {
    const rollId = ulid();
    await db.frames.bulkAdd([
      { id: ulid(), roll_id: rollId, frame_number: 3, shutter_speed: "1/250", aperture: 4, captured_at: now, updated_at: now, created_at: now },
      { id: ulid(), roll_id: rollId, frame_number: 1, shutter_speed: "1/60", aperture: 8, captured_at: now, updated_at: now, created_at: now },
      { id: ulid(), roll_id: rollId, frame_number: 2, shutter_speed: "1/125", aperture: 5.6, captured_at: now, updated_at: now, created_at: now },
    ]);

    const frames = await db.frames.where("roll_id").equals(rollId).sortBy("frame_number");
    expect(frames.map((f) => f.frame_number)).toEqual([1, 2, 3]);
  });
});

describe("Settings persistence (_syncMeta)", () => {
  it("stores and retrieves settings", async () => {
    await db._syncMeta.put({ key: "theme", value: "dark" });
    const row = await db._syncMeta.get("theme");
    expect(row?.value).toBe("dark");
  });

  it("overwrites settings with put", async () => {
    await db._syncMeta.put({ key: "theme", value: "dark" });
    await db._syncMeta.put({ key: "theme", value: "light" });
    const row = await db._syncMeta.get("theme");
    expect(row?.value).toBe("light");
  });
});

describe("Seed idempotency", () => {
  it("seeding twice results in same count", async () => {
    await seedFilmStocks(db.filmStock);
    const count1 = await db.filmStock.count();
    await seedFilmStocks(db.filmStock);
    const count2 = await db.filmStock.count();
    expect(count1).toBe(count2);
    expect(count1).toBeGreaterThanOrEqual(80);
  });

  it("sentinel pattern prevents double-seeding logic", async () => {
    // Simulate sentinel check like the app does
    const sentinel = await db._syncMeta.get("seeded");
    expect(sentinel).toBeUndefined();

    await seedFilmStocks(db.filmStock);
    await db._syncMeta.put({ key: "seeded", value: "1" });

    const afterSeed = await db._syncMeta.get("seeded");
    expect(afterSeed?.value).toBe("1");
  });
});
