import type { SupabaseClient } from "@supabase/supabase-js";

export interface EngagementBucket {
  name: string;
  count: number;
}

export async function fetchEngagementDepth(
  admin: SupabaseClient,
): Promise<EngagementBucket[]> {
  // Get roll count per user
  const { data: rolls } = await admin
    .from("rolls")
    .select("user_id");

  if (!rolls) return [];

  // Count rolls per user
  const userRolls = new Map<string, number>();
  for (const row of rolls) {
    userRolls.set(row.user_id, (userRolls.get(row.user_id) ?? 0) + 1);
  }

  // Get all users to include zero-roll users
  const { count: totalUsers } = await admin
    .from("user_profiles")
    .select("*", { count: "exact", head: true });

  const usersWithRolls = userRolls.size;
  const zeroRolls = (totalUsers ?? 0) - usersWithRolls;

  let oneToFive = 0;
  let sixToTwenty = 0;
  let twentyPlus = 0;

  for (const count of userRolls.values()) {
    if (count <= 5) oneToFive++;
    else if (count <= 20) sixToTwenty++;
    else twentyPlus++;
  }

  return [
    { name: "0 rolls", count: zeroRolls },
    { name: "1-5 rolls", count: oneToFive },
    { name: "6-20 rolls", count: sixToTwenty },
    { name: "20+ rolls", count: twentyPlus },
  ];
}
