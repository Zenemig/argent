import { describe, it, expect } from "vitest";
import {
  cameraSchema,
  lensSchema,
  filmSchema,
  rollSchema,
  frameSchema,
  filmStockSchema,
  syncQueueItemSchema,
} from "./schemas";

const now = Date.now();
const ULID = "01HXYZ1234567890ABCDEFGHJK";
const ULID2 = "01HXYZ1234567890ABCDEFGHJN";

describe("cameraSchema", () => {
  const valid = {
    id: ULID,
    user_id: "user_123",
    name: "Nikon FM2",
    make: "Nikon",
    format: "35mm" as const,
    default_frame_count: 36,
    notes: null,
    deleted_at: null,
    updated_at: now,
    created_at: now,
  };

  it("validates a correct camera", () => {
    expect(cameraSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing name", () => {
    expect(cameraSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects invalid format", () => {
    expect(
      cameraSchema.safeParse({ ...valid, format: "110" }).success,
    ).toBe(false);
  });
});

describe("lensSchema", () => {
  const valid = {
    id: ULID,
    user_id: "user_123",
    camera_id: null,
    name: "Nikkor 50mm f/1.4 AI-S",
    make: "Nikon",
    focal_length: 50,
    max_aperture: 1.4,
    deleted_at: null,
    updated_at: now,
    created_at: now,
  };

  it("validates a correct lens", () => {
    expect(lensSchema.safeParse(valid).success).toBe(true);
  });

  it("allows camera_id to be a ULID", () => {
    expect(
      lensSchema.safeParse({ ...valid, camera_id: ULID2 }).success,
    ).toBe(true);
  });
});

describe("filmSchema", () => {
  const valid = {
    id: ULID,
    user_id: "user_123",
    brand: "Kodak",
    name: "Portra 400",
    iso: 400,
    format: "35mm" as const,
    process: "C-41" as const,
    is_custom: false,
    deleted_at: null,
    updated_at: now,
    created_at: now,
  };

  it("validates a correct film", () => {
    expect(filmSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid process", () => {
    expect(
      filmSchema.safeParse({ ...valid, process: "X-ray" }).success,
    ).toBe(false);
  });
});

describe("rollSchema", () => {
  const valid = {
    id: ULID,
    user_id: "user_123",
    camera_id: ULID,
    film_id: ULID2,
    lens_id: null,
    status: "loaded" as const,
    frame_count: 36,
    ei: 400,
    push_pull: 0,
    lab_name: null,
    dev_notes: null,
    start_date: now,
    finish_date: null,
    develop_date: null,
    scan_date: null,
    notes: null,
    deleted_at: null,
    updated_at: now,
    created_at: now,
  };

  it("validates a correct roll", () => {
    expect(rollSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(
      rollSchema.safeParse({ ...valid, status: "processing" }).success,
    ).toBe(false);
  });

  it("accepts push/pull values", () => {
    expect(
      rollSchema.safeParse({ ...valid, push_pull: 2 }).success,
    ).toBe(true);
    expect(
      rollSchema.safeParse({ ...valid, push_pull: -1 }).success,
    ).toBe(true);
  });
});

describe("frameSchema", () => {
  const valid = {
    id: ULID,
    roll_id: ULID,
    frame_number: 1,
    shutter_speed: "1/125",
    aperture: 5.6,
    lens_id: null,
    metering_mode: "spot" as const,
    exposure_comp: 0,
    filter: null,
    latitude: 40.7128,
    longitude: -74.006,
    location_name: "New York",
    notes: null,
    thumbnail: null,
    image_url: null,
    captured_at: now,
    updated_at: now,
    created_at: now,
  };

  it("validates a correct frame", () => {
    expect(frameSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects out-of-range latitude", () => {
    expect(
      frameSchema.safeParse({ ...valid, latitude: 91 }).success,
    ).toBe(false);
  });

  it("rejects out-of-range longitude", () => {
    expect(
      frameSchema.safeParse({ ...valid, longitude: -181 }).success,
    ).toBe(false);
  });
});

describe("filmStockSchema", () => {
  it("validates a seed film stock", () => {
    const valid = {
      id: "kodak-portra-400",
      brand: "Kodak",
      name: "Portra 400",
      iso: 400,
      format: ["35mm", "120"],
      process: "C-41",
    };
    expect(filmStockSchema.safeParse(valid).success).toBe(true);
  });
});

describe("syncQueueItemSchema", () => {
  it("validates a sync queue item", () => {
    const valid = {
      table: "cameras" as const,
      entity_id: ULID,
      operation: "create" as const,
      status: "pending" as const,
      retry_count: 0,
      last_attempt: null,
      payload: null,
    };
    expect(syncQueueItemSchema.safeParse(valid).success).toBe(true);
  });
});
