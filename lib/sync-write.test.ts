import { describe, it, expect, vi, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { ArgentDb } from "./db";

let testDb: ArgentDb;

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    get db() {
      return testDb;
    },
  };
});

const { syncAdd, syncUpdate } = await import("./sync-write");

describe("syncAdd", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
  });

  it("adds entity to the table and enqueues a create operation", async () => {
    const camera = {
      id: "cam-001",
      user_id: "user-1",
      name: "Nikon FM2",
      make: "Nikon",
      format: "35mm" as const,
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    };

    await syncAdd("cameras", camera);

    const stored = await testDb.cameras.get("cam-001");
    expect(stored).toBeDefined();
    expect(stored!.name).toBe("Nikon FM2");

    const queue = await testDb._syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe("cameras");
    expect(queue[0].entity_id).toBe("cam-001");
    expect(queue[0].operation).toBe("create");
    expect(queue[0].status).toBe("pending");
    expect(queue[0].retry_count).toBe(0);
  });

  it("enqueues for frames table", async () => {
    const frame = {
      id: "frame-001",
      roll_id: "roll-001",
      frame_number: 1,
      shutter_speed: "1/125",
      aperture: 5.6,
      lens_id: null,
      metering_mode: null,
      exposure_comp: 0,
      filter: null,
      latitude: null,
      longitude: null,
      location_name: null,
      notes: null,
      thumbnail: null,
      image_url: null,
      captured_at: Date.now(),
      updated_at: Date.now(),
      created_at: Date.now(),
    };

    await syncAdd("frames", frame);

    const stored = await testDb.frames.get("frame-001");
    expect(stored).toBeDefined();

    const queue = await testDb._syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe("frames");
    expect(queue[0].entity_id).toBe("frame-001");
  });
});

describe("syncUpdate", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
  });

  it("updates entity in the table and enqueues an update operation", async () => {
    await testDb.cameras.add({
      id: "cam-002",
      user_id: "user-1",
      name: "Canon AE-1",
      make: "Canon",
      format: "35mm" as const,
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    });

    await syncUpdate("cameras", "cam-002", {
      name: "Canon AE-1 Program",
      updated_at: Date.now(),
    });

    const stored = await testDb.cameras.get("cam-002");
    expect(stored!.name).toBe("Canon AE-1 Program");

    const queue = await testDb._syncQueue.toArray();
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe("cameras");
    expect(queue[0].entity_id).toBe("cam-002");
    expect(queue[0].operation).toBe("update");
    expect(queue[0].status).toBe("pending");
  });

  it("creates separate queue entries for multiple updates", async () => {
    await testDb.cameras.add({
      id: "cam-003",
      user_id: "user-1",
      name: "Pentax K1000",
      make: "Pentax",
      format: "35mm" as const,
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    });

    await syncUpdate("cameras", "cam-003", { name: "Updated 1" });
    await syncUpdate("cameras", "cam-003", { name: "Updated 2" });

    const queue = await testDb._syncQueue.toArray();
    expect(queue).toHaveLength(2);
  });
});
