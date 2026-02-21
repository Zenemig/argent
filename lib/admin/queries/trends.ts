import type { SupabaseClient } from "@supabase/supabase-js";

export interface DistributionItem {
  name: string;
  count: number;
}

export interface ShootingTrends {
  filmFormats: DistributionItem[];
  filmProcesses: DistributionItem[];
  cameraTypes: DistributionItem[];
}

export async function fetchShootingTrends(
  admin: SupabaseClient,
): Promise<ShootingTrends> {
  // Fetch rolls with their camera and film details
  const { data: rolls } = await admin
    .from("rolls")
    .select("camera_id, film_id");

  if (!rolls || rolls.length === 0) {
    return { filmFormats: [], filmProcesses: [], cameraTypes: [] };
  }

  // Get unique camera and film IDs
  const cameraIds = [...new Set(rolls.map((r) => r.camera_id))];
  const filmIds = [...new Set(rolls.map((r) => r.film_id))];

  const [camerasRes, filmsRes] = await Promise.all([
    admin.from("cameras").select("id, format, type").in("id", cameraIds),
    admin.from("films").select("id, format, process").in("id", filmIds),
  ]);

  const cameraMap = new Map(
    (camerasRes.data ?? []).map((c) => [c.id, c]),
  );
  const filmMap = new Map(
    (filmsRes.data ?? []).map((f) => [f.id, f]),
  );

  // Count distributions
  const formatCounts = new Map<string, number>();
  const processCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();

  for (const roll of rolls) {
    const camera = cameraMap.get(roll.camera_id);
    const film = filmMap.get(roll.film_id);

    if (camera?.format) {
      formatCounts.set(
        camera.format,
        (formatCounts.get(camera.format) ?? 0) + 1,
      );
    }
    if (camera?.type) {
      typeCounts.set(camera.type, (typeCounts.get(camera.type) ?? 0) + 1);
    }
    if (film?.process) {
      processCounts.set(
        film.process,
        (processCounts.get(film.process) ?? 0) + 1,
      );
    }
  }

  const toSorted = (map: Map<string, number>): DistributionItem[] =>
    Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

  return {
    filmFormats: toSorted(formatCounts),
    filmProcesses: toSorted(processCounts),
    cameraTypes: toSorted(typeCounts),
  };
}
