import { describe, it, expect } from "vitest";
import { filterAndSortRolls, buildFilmMap } from "./filter-rolls";
import type { Roll, Camera, Film, FilmStock } from "./types";

// ---------------------------------------------------------------------------
// Factory
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

const defaultFilters = {
  searchQuery: "",
  statusFilter: "all",
  cameraFilter: "all",
  filmFilter: "all",
  sortBy: "date" as const,
};

const cameras: Camera[] = [
  { id: "cam-1", name: "Nikon FM2" },
  { id: "cam-2", name: "Leica M6" },
] as Camera[];

const filmMap = buildFilmMap(
  [{ id: "film-1", brand: "Kodak", name: "Portra 400" }] as Film[],
  [{ id: "film-2", brand: "Ilford", name: "HP5" }] as FilmStock[],
);

// ---------------------------------------------------------------------------
// buildFilmMap
// ---------------------------------------------------------------------------

describe("buildFilmMap", () => {
  it("combines custom and seed films", () => {
    expect(filmMap.size).toBe(2);
    expect(filmMap.get("film-1")?.brand).toBe("Kodak");
    expect(filmMap.get("film-2")?.brand).toBe("Ilford");
  });
});

// ---------------------------------------------------------------------------
// filterAndSortRolls
// ---------------------------------------------------------------------------

describe("filterAndSortRolls", () => {
  it("returns all rolls with default filters", () => {
    const rolls = [
      makeRoll({ id: "r1" }),
      makeRoll({ id: "r2" }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, defaultFilters);
    expect(result.length).toBe(2);
  });

  it("filters by status", () => {
    const rolls = [
      makeRoll({ id: "r1", status: "active" }),
      makeRoll({ id: "r2", status: "finished" }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      statusFilter: "active",
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("r1");
  });

  it("filters by camera", () => {
    const rolls = [
      makeRoll({ id: "r1", camera_id: "cam-1" }),
      makeRoll({ id: "r2", camera_id: "cam-2" }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      cameraFilter: "cam-1",
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("r1");
  });

  it("filters by film", () => {
    const rolls = [
      makeRoll({ id: "r1", film_id: "film-1" }),
      makeRoll({ id: "r2", film_id: "film-2" }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      filmFilter: "film-1",
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("r1");
  });

  it("searches by camera name", () => {
    const rolls = [
      makeRoll({ id: "r1", camera_id: "cam-1" }),
      makeRoll({ id: "r2", camera_id: "cam-2" }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      searchQuery: "nikon",
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("r1");
  });

  it("searches by film name", () => {
    const rolls = [
      makeRoll({ id: "r1", film_id: "film-1" }),
      makeRoll({ id: "r2", film_id: "film-2" }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      searchQuery: "portra",
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("r1");
  });

  it("searches by notes", () => {
    const rolls = [
      makeRoll({ id: "r1", notes: "Central Park" }),
      makeRoll({ id: "r2", notes: null }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      searchQuery: "park",
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("r1");
  });

  it("searches by lab name", () => {
    const rolls = [
      makeRoll({ id: "r1", lab_name: "The Darkroom" }),
      makeRoll({ id: "r2", lab_name: null }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      searchQuery: "darkroom",
    });
    expect(result.length).toBe(1);
  });

  it("combines multiple filters", () => {
    const rolls = [
      makeRoll({ id: "r1", camera_id: "cam-1", status: "active" }),
      makeRoll({ id: "r2", camera_id: "cam-1", status: "finished" }),
      makeRoll({ id: "r3", camera_id: "cam-2", status: "active" }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      statusFilter: "active",
      cameraFilter: "cam-1",
    });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("r1");
  });

  it("sorts by date descending (default)", () => {
    const rolls = [
      makeRoll({ id: "r1", created_at: 1000 }),
      makeRoll({ id: "r2", created_at: 3000 }),
      makeRoll({ id: "r3", created_at: 2000 }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, defaultFilters);
    expect(result.map((r) => r.id)).toEqual(["r2", "r3", "r1"]);
  });

  it("sorts by status lifecycle order", () => {
    const rolls = [
      makeRoll({ id: "r1", status: "archived" }),
      makeRoll({ id: "r2", status: "active" }),
      makeRoll({ id: "r3", status: "loaded" }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      sortBy: "status",
    });
    expect(result.map((r) => r.status)).toEqual([
      "loaded",
      "active",
      "archived",
    ]);
  });

  it("sorts by camera name alphabetically", () => {
    const rolls = [
      makeRoll({ id: "r1", camera_id: "cam-2" }),
      makeRoll({ id: "r2", camera_id: "cam-1" }),
    ];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      sortBy: "camera",
    });
    expect(result[0].camera_id).toBe("cam-2"); // Leica < Nikon
    expect(result[1].camera_id).toBe("cam-1");
  });

  it("returns empty array for no matches", () => {
    const rolls = [makeRoll({ id: "r1", status: "active" })];
    const result = filterAndSortRolls(rolls, cameras, filmMap, {
      ...defaultFilters,
      statusFilter: "finished",
    });
    expect(result).toEqual([]);
  });
});
