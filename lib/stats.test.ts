import { describe, it, expect } from "vitest";
import {
  computeFilmUsage,
  computeShotsPerMonth,
  computeCameraUsage,
  computeFocalLengthUsage,
  computeAvgFramesPerRoll,
} from "./stats";
import type { Roll, Frame, Camera, Lens, Film, FilmStock } from "./types";

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeRoll(overrides: Partial<Roll> = {}): Roll {
  return {
    id: "roll-1",
    user_id: "user-1",
    camera_id: "cam-1",
    film_id: "film-1",
    lens_id: null,
    status: "active",
    frame_count: 36,
    ei: 400,
    push_pull: 0,
    lab_name: null,
    dev_notes: null,
    start_date: Date.now(),
    finish_date: null,
    develop_date: null,
    scan_date: null,
    notes: null,
    deleted_at: null,
    updated_at: Date.now(),
    created_at: Date.now(),
    ...overrides,
  };
}

function makeFrame(overrides: Partial<Frame> = {}): Frame {
  return {
    id: "frame-1",
    roll_id: "roll-1",
    frame_number: 1,
    shutter_speed: "1/125",
    aperture: 8,
    lens_id: null,
    metering_mode: null,
    exposure_comp: null,
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
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeFilmUsage
// ---------------------------------------------------------------------------

describe("computeFilmUsage", () => {
  it("returns top films by roll count", () => {
    const rolls = [
      makeRoll({ id: "r1", film_id: "f1" }),
      makeRoll({ id: "r2", film_id: "f1" }),
      makeRoll({ id: "r3", film_id: "f2" }),
    ];
    const customFilms = [
      { id: "f1", brand: "Kodak", name: "Portra 400" },
    ] as Film[];
    const seedFilms = [
      { id: "f2", brand: "Ilford", name: "HP5" },
    ] as FilmStock[];

    const result = computeFilmUsage(rolls, customFilms, seedFilms);
    expect(result).toEqual([
      { name: "Kodak Portra 400", count: 2 },
      { name: "Ilford HP5", count: 1 },
    ]);
  });

  it("limits to N results", () => {
    const rolls = Array.from({ length: 10 }, (_, i) =>
      makeRoll({ id: `r${i}`, film_id: `f${i}` }),
    );
    const seedFilms = rolls.map((r) => ({
      id: r.film_id,
      brand: "Brand",
      name: `Film ${r.film_id}`,
    })) as FilmStock[];

    const result = computeFilmUsage(rolls, [], seedFilms, 3);
    expect(result.length).toBe(3);
  });

  it("returns empty array for no rolls", () => {
    expect(computeFilmUsage([], [], [])).toEqual([]);
  });

  it("uses 'Unknown' for missing film", () => {
    const rolls = [makeRoll({ id: "r1", film_id: "missing" })];
    const result = computeFilmUsage(rolls, [], []);
    expect(result[0].name).toBe("Unknown");
  });
});

// ---------------------------------------------------------------------------
// computeShotsPerMonth
// ---------------------------------------------------------------------------

describe("computeShotsPerMonth", () => {
  it("groups frames by month", () => {
    const jan = new Date(2025, 0, 15).getTime();
    const feb = new Date(2025, 1, 10).getTime();
    const frames = [
      makeFrame({ id: "f1", captured_at: jan }),
      makeFrame({ id: "f2", captured_at: jan + 86400000 }),
      makeFrame({ id: "f3", captured_at: feb }),
    ];

    const result = computeShotsPerMonth(frames);
    expect(result).toEqual([
      { month: "2025-01", count: 2 },
      { month: "2025-02", count: 1 },
    ]);
  });

  it("sorts chronologically", () => {
    const mar = new Date(2025, 2, 1).getTime();
    const jan = new Date(2025, 0, 1).getTime();
    const frames = [
      makeFrame({ id: "f1", captured_at: mar }),
      makeFrame({ id: "f2", captured_at: jan }),
    ];

    const result = computeShotsPerMonth(frames);
    expect(result[0].month).toBe("2025-01");
    expect(result[1].month).toBe("2025-03");
  });

  it("returns empty array for no frames", () => {
    expect(computeShotsPerMonth([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeCameraUsage
// ---------------------------------------------------------------------------

describe("computeCameraUsage", () => {
  it("returns top cameras by roll count", () => {
    const rolls = [
      makeRoll({ id: "r1", camera_id: "c1" }),
      makeRoll({ id: "r2", camera_id: "c1" }),
      makeRoll({ id: "r3", camera_id: "c2" }),
    ];
    const cameras = [
      { id: "c1", name: "Nikon FM2" },
      { id: "c2", name: "Leica M6" },
    ] as Camera[];

    const result = computeCameraUsage(rolls, cameras);
    expect(result).toEqual([
      { name: "Nikon FM2", count: 2 },
      { name: "Leica M6", count: 1 },
    ]);
  });

  it("returns empty array for no rolls", () => {
    expect(computeCameraUsage([], [])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeFocalLengthUsage
// ---------------------------------------------------------------------------

describe("computeFocalLengthUsage", () => {
  it("groups frames by lens focal length", () => {
    const frames = [
      makeFrame({ id: "f1", lens_id: "l1" }),
      makeFrame({ id: "f2", lens_id: "l1" }),
      makeFrame({ id: "f3", lens_id: "l2" }),
    ];
    const lenses = [
      { id: "l1", focal_length: 50 },
      { id: "l2", focal_length: 28 },
    ] as Lens[];

    const result = computeFocalLengthUsage(frames, lenses);
    expect(result).toEqual([
      { focalLength: "50mm", count: 2 },
      { focalLength: "28mm", count: 1 },
    ]);
  });

  it("skips frames with no lens_id", () => {
    const frames = [
      makeFrame({ id: "f1", lens_id: null }),
      makeFrame({ id: "f2", lens_id: "l1" }),
    ];
    const lenses = [{ id: "l1", focal_length: 50 }] as Lens[];

    const result = computeFocalLengthUsage(frames, lenses);
    expect(result.length).toBe(1);
  });

  it("skips frames with unknown lens", () => {
    const frames = [makeFrame({ id: "f1", lens_id: "unknown" })];
    expect(computeFocalLengthUsage(frames, [])).toEqual([]);
  });

  it("returns empty array for no frames", () => {
    expect(computeFocalLengthUsage([], [])).toEqual([]);
  });

  it("prefers frame focal_length over lens focal_length", () => {
    const frames = [
      makeFrame({ id: "f1", lens_id: "l1", focal_length: 35 }),
      makeFrame({ id: "f2", lens_id: "l1", focal_length: 70 }),
      makeFrame({ id: "f3", lens_id: "l1", focal_length: 35 }),
    ];
    const lenses = [
      { id: "l1", focal_length: 24 },
    ] as Lens[];

    const result = computeFocalLengthUsage(frames, lenses);
    expect(result).toEqual([
      { focalLength: "35mm", count: 2 },
      { focalLength: "70mm", count: 1 },
    ]);
  });

  it("falls back to lens focal_length when frame has no focal_length", () => {
    const frames = [
      makeFrame({ id: "f1", lens_id: "l1" }),
      makeFrame({ id: "f2", lens_id: "l1", focal_length: 50 }),
    ];
    const lenses = [
      { id: "l1", focal_length: 24 },
    ] as Lens[];

    const result = computeFocalLengthUsage(frames, lenses);
    expect(result).toEqual([
      { focalLength: "24mm", count: 1 },
      { focalLength: "50mm", count: 1 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// computeAvgFramesPerRoll
// ---------------------------------------------------------------------------

describe("computeAvgFramesPerRoll", () => {
  it("computes average across rolls", () => {
    const rolls = [
      makeRoll({ id: "r1" }),
      makeRoll({ id: "r2" }),
    ];
    const counts = new Map([
      ["r1", 24],
      ["r2", 36],
    ]);

    expect(computeAvgFramesPerRoll(rolls, counts)).toBe(30);
  });

  it("returns 0 for no rolls", () => {
    expect(computeAvgFramesPerRoll([], new Map())).toBe(0);
  });

  it("handles rolls with no frames", () => {
    const rolls = [makeRoll({ id: "r1" })];
    expect(computeAvgFramesPerRoll(rolls, new Map())).toBe(0);
  });

  it("rounds to one decimal place", () => {
    const rolls = [
      makeRoll({ id: "r1" }),
      makeRoll({ id: "r2" }),
      makeRoll({ id: "r3" }),
    ];
    const counts = new Map([
      ["r1", 10],
      ["r2", 11],
      ["r3", 12],
    ]);

    expect(computeAvgFramesPerRoll(rolls, counts)).toBe(11);
  });
});
