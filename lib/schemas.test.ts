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

  it("accepts mount field with valid lens mount", () => {
    expect(
      cameraSchema.safeParse({ ...valid, mount: "Nikon F" }).success,
    ).toBe(true);
  });

  it("accepts null mount (backward compat)", () => {
    expect(
      cameraSchema.safeParse({ ...valid, mount: null }).success,
    ).toBe(true);
  });

  it("validates without mount field (backward compat)", () => {
    expect(cameraSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid mount value", () => {
    expect(
      cameraSchema.safeParse({ ...valid, mount: "Invalid Mount" }).success,
    ).toBe(false);
  });

  it("accepts type field with valid camera type", () => {
    expect(
      cameraSchema.safeParse({ ...valid, type: "slr" }).success,
    ).toBe(true);
  });

  it("accepts null type (backward compat)", () => {
    expect(
      cameraSchema.safeParse({ ...valid, type: null }).success,
    ).toBe(true);
  });

  it("validates without type field (backward compat)", () => {
    expect(cameraSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid type value", () => {
    expect(
      cameraSchema.safeParse({ ...valid, type: "dslr" }).success,
    ).toBe(false);
  });

  it("accepts shutter_speed_min with valid shutter speed", () => {
    expect(
      cameraSchema.safeParse({ ...valid, shutter_speed_min: "1s" }).success,
    ).toBe(true);
  });

  it("accepts null shutter_speed_min", () => {
    expect(
      cameraSchema.safeParse({ ...valid, shutter_speed_min: null }).success,
    ).toBe(true);
  });

  it("validates without shutter_speed_min (backward compat)", () => {
    expect(cameraSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid shutter_speed_min value", () => {
    expect(
      cameraSchema.safeParse({ ...valid, shutter_speed_min: "1/3" }).success,
    ).toBe(false);
  });

  it("rejects B as shutter_speed_min (bulb is separate)", () => {
    expect(
      cameraSchema.safeParse({ ...valid, shutter_speed_min: "B" }).success,
    ).toBe(false);
  });

  it("rejects B as shutter_speed_max (bulb is separate)", () => {
    expect(
      cameraSchema.safeParse({ ...valid, shutter_speed_max: "B" }).success,
    ).toBe(false);
  });

  it("accepts has_bulb true", () => {
    expect(
      cameraSchema.safeParse({ ...valid, has_bulb: true }).success,
    ).toBe(true);
  });

  it("accepts has_bulb false", () => {
    expect(
      cameraSchema.safeParse({ ...valid, has_bulb: false }).success,
    ).toBe(true);
  });

  it("accepts null has_bulb", () => {
    expect(
      cameraSchema.safeParse({ ...valid, has_bulb: null }).success,
    ).toBe(true);
  });

  it("validates without has_bulb (backward compat)", () => {
    expect(cameraSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts shutter_speed_max with valid shutter speed", () => {
    expect(
      cameraSchema.safeParse({ ...valid, shutter_speed_max: "1/4000" }).success,
    ).toBe(true);
  });

  it("accepts null shutter_speed_max", () => {
    expect(
      cameraSchema.safeParse({ ...valid, shutter_speed_max: null }).success,
    ).toBe(true);
  });

  it("validates without shutter_speed_max (backward compat)", () => {
    expect(cameraSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts metering_modes with valid modes array", () => {
    expect(
      cameraSchema.safeParse({ ...valid, metering_modes: ["center", "sunny16"] }).success,
    ).toBe(true);
  });

  it("accepts null metering_modes", () => {
    expect(
      cameraSchema.safeParse({ ...valid, metering_modes: null }).success,
    ).toBe(true);
  });

  it("validates without metering_modes (backward compat)", () => {
    expect(cameraSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects metering_modes with invalid mode", () => {
    expect(
      cameraSchema.safeParse({ ...valid, metering_modes: ["laser"] }).success,
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

  it("accepts zoom lens fields", () => {
    expect(
      lensSchema.safeParse({
        ...valid,
        focal_length_max: 135,
        min_aperture: 4.5,
      }).success,
    ).toBe(true);
  });

  it("accepts null zoom lens fields (prime lens)", () => {
    expect(
      lensSchema.safeParse({
        ...valid,
        focal_length_max: null,
        min_aperture: null,
      }).success,
    ).toBe(true);
  });

  it("validates without zoom fields (backward compat)", () => {
    expect(lensSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-positive focal_length_max", () => {
    expect(
      lensSchema.safeParse({ ...valid, focal_length_max: 0 }).success,
    ).toBe(false);
  });

  it("rejects non-positive min_aperture", () => {
    expect(
      lensSchema.safeParse({ ...valid, min_aperture: -1 }).success,
    ).toBe(false);
  });

  it("accepts mount field with valid lens mount", () => {
    expect(
      lensSchema.safeParse({ ...valid, mount: "Nikon F" }).success,
    ).toBe(true);
  });

  it("accepts null mount (backward compat)", () => {
    expect(
      lensSchema.safeParse({ ...valid, mount: null }).success,
    ).toBe(true);
  });

  it("validates without mount field (backward compat)", () => {
    expect(lensSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid mount value", () => {
    expect(
      lensSchema.safeParse({ ...valid, mount: "Invalid Mount" }).success,
    ).toBe(false);
  });

  it("accepts aperture_min with valid positive number", () => {
    expect(
      lensSchema.safeParse({ ...valid, aperture_min: 16 }).success,
    ).toBe(true);
  });

  it("accepts null aperture_min", () => {
    expect(
      lensSchema.safeParse({ ...valid, aperture_min: null }).success,
    ).toBe(true);
  });

  it("validates without aperture_min (backward compat)", () => {
    expect(lensSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-positive aperture_min", () => {
    expect(
      lensSchema.safeParse({ ...valid, aperture_min: 0 }).success,
    ).toBe(false);
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

  it("accepts focal_length for per-frame focal length", () => {
    expect(
      frameSchema.safeParse({ ...valid, focal_length: 85 }).success,
    ).toBe(true);
  });

  it("accepts null focal_length (prime lens or not set)", () => {
    expect(
      frameSchema.safeParse({ ...valid, focal_length: null }).success,
    ).toBe(true);
  });

  it("validates without focal_length (backward compat)", () => {
    expect(frameSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-positive focal_length", () => {
    expect(
      frameSchema.safeParse({ ...valid, focal_length: 0 }).success,
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
