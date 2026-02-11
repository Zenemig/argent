import type { Roll, Frame, Camera, Lens, Film, FilmStock } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick top N items sorted by count descending. */
function topN<T extends { count: number }>(items: T[], n: number): T[] {
  return [...items].sort((a, b) => b.count - a.count).slice(0, n);
}

/** Format a timestamp to "YYYY-MM" string. */
function toMonthKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ---------------------------------------------------------------------------
// Film usage
// ---------------------------------------------------------------------------

export function computeFilmUsage(
  rolls: Roll[],
  customFilms: Film[],
  seedFilms: FilmStock[],
  limit = 5,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const roll of rolls) {
    counts.set(roll.film_id, (counts.get(roll.film_id) ?? 0) + 1);
  }

  const filmMap = new Map<string, string>();
  for (const f of customFilms) filmMap.set(f.id, `${f.brand} ${f.name}`);
  for (const f of seedFilms) filmMap.set(f.id, `${f.brand} ${f.name}`);

  const items = Array.from(counts, ([id, count]) => ({
    name: filmMap.get(id) ?? "Unknown",
    count,
  }));

  return topN(items, limit);
}

// ---------------------------------------------------------------------------
// Shots per month
// ---------------------------------------------------------------------------

export function computeShotsPerMonth(
  frames: Frame[],
): { month: string; count: number }[] {
  if (frames.length === 0) return [];

  const counts = new Map<string, number>();
  for (const frame of frames) {
    const key = toMonthKey(frame.captured_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Sort chronologically
  return Array.from(counts, ([month, count]) => ({ month, count })).sort(
    (a, b) => a.month.localeCompare(b.month),
  );
}

// ---------------------------------------------------------------------------
// Camera usage
// ---------------------------------------------------------------------------

export function computeCameraUsage(
  rolls: Roll[],
  cameras: Camera[],
  limit = 5,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const roll of rolls) {
    counts.set(roll.camera_id, (counts.get(roll.camera_id) ?? 0) + 1);
  }

  const camMap = new Map<string, string>();
  for (const c of cameras) camMap.set(c.id, c.name);

  const items = Array.from(counts, ([id, count]) => ({
    name: camMap.get(id) ?? "Unknown",
    count,
  }));

  return topN(items, limit);
}

// ---------------------------------------------------------------------------
// Focal length usage
// ---------------------------------------------------------------------------

export function computeFocalLengthUsage(
  frames: Frame[],
  lenses: Lens[],
  limit = 5,
): { focalLength: string; count: number }[] {
  const lensMap = new Map<string, number>();
  for (const l of lenses) lensMap.set(l.id, l.focal_length);

  const counts = new Map<number, number>();
  for (const frame of frames) {
    // Prefer per-frame focal length (zoom lenses) over lens default
    const fl = frame.focal_length ?? (frame.lens_id ? lensMap.get(frame.lens_id) : undefined);
    if (fl === undefined) continue;
    counts.set(fl, (counts.get(fl) ?? 0) + 1);
  }

  const items = Array.from(counts, ([fl, count]) => ({
    focalLength: `${fl}mm`,
    count,
  }));

  return topN(items, limit);
}

// ---------------------------------------------------------------------------
// Average frames per roll
// ---------------------------------------------------------------------------

export function computeAvgFramesPerRoll(
  rolls: Roll[],
  frameCounts: Map<string, number>,
): number {
  if (rolls.length === 0) return 0;
  let total = 0;
  for (const roll of rolls) {
    total += frameCounts.get(roll.id) ?? 0;
  }
  return Math.round((total / rolls.length) * 10) / 10;
}
