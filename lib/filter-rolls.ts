import type { Roll, Camera, Film, FilmStock } from "./types";
import { STATUS_ORDER } from "./roll-lifecycle";

export interface RollFilters {
  searchQuery: string;
  statusFilter: string;
  cameraFilter: string;
  filmFilter: string;
  sortBy: "date" | "status" | "camera";
}

interface FilmInfo {
  id: string;
  brand: string;
  name: string;
}

/** Build a unified film lookup from custom + seed films. */
export function buildFilmMap(
  customFilms: Film[],
  seedFilms: FilmStock[],
): Map<string, FilmInfo> {
  const map = new Map<string, FilmInfo>();
  for (const f of customFilms)
    map.set(f.id, { id: f.id, brand: f.brand, name: f.name });
  for (const f of seedFilms)
    map.set(f.id, { id: f.id, brand: f.brand, name: f.name });
  return map;
}

/** Filter and sort rolls based on user-selected criteria. */
export function filterAndSortRolls(
  rolls: Roll[],
  cameras: Camera[],
  filmMap: Map<string, FilmInfo>,
  filters: RollFilters,
): Roll[] {
  const cameraMap = new Map<string, string>();
  for (const c of cameras) cameraMap.set(c.id, c.name);

  const query = filters.searchQuery.toLowerCase().trim();

  let result = rolls.filter((roll) => {
    // Status filter — "all" hides discarded rolls by default
    if (filters.statusFilter === "all") {
      if (roll.status === "discarded") return false;
    } else if (roll.status !== filters.statusFilter) {
      return false;
    }

    // Camera filter
    if (filters.cameraFilter !== "all" && roll.camera_id !== filters.cameraFilter)
      return false;

    // Film filter
    if (filters.filmFilter !== "all" && roll.film_id !== filters.filmFilter)
      return false;

    // Text search
    if (query) {
      const camName = (cameraMap.get(roll.camera_id) ?? "").toLowerCase();
      const film = filmMap.get(roll.film_id);
      const filmLabel = film
        ? `${film.brand} ${film.name}`.toLowerCase()
        : "";
      const notes = (roll.notes ?? "").toLowerCase();
      const labName = (roll.lab_name ?? "").toLowerCase();

      if (
        !camName.includes(query) &&
        !filmLabel.includes(query) &&
        !notes.includes(query) &&
        !labName.includes(query)
      )
        return false;
    }

    return true;
  });

  // Sort
  switch (filters.sortBy) {
    case "status":
      result = [...result].sort((a, b) => {
        const idxA = STATUS_ORDER.indexOf(a.status);
        const idxB = STATUS_ORDER.indexOf(b.status);
        return (
          (idxA === -1 ? STATUS_ORDER.length : idxA) -
          (idxB === -1 ? STATUS_ORDER.length : idxB)
        );
      });
      break;
    case "camera":
      result = [...result].sort((a, b) => {
        const nameA = cameraMap.get(a.camera_id) ?? "";
        const nameB = cameraMap.get(b.camera_id) ?? "";
        return nameA.localeCompare(nameB);
      });
      break;
    case "date":
    default:
      result = [...result].sort((a, b) => b.created_at - a.created_at);
      break;
  }

  return result;
}
