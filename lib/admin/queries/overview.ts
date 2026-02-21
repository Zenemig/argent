import type { SupabaseClient } from "@supabase/supabase-js";

export interface OverviewKpis {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  waitlistUsers: number;
  totalRolls: number;
  totalFrames: number;
  totalExports: number;
}

export async function fetchOverviewKpis(
  admin: SupabaseClient,
): Promise<OverviewKpis> {
  const [
    totalUsersRes,
    proUsersRes,
    waitlistRes,
    rollsRes,
    framesRes,
    exportsRes,
  ] = await Promise.all([
    admin.from("user_profiles").select("*", { count: "exact", head: true }),
    admin
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .eq("tier", "pro"),
    admin.from("waitlist").select("*", { count: "exact", head: true }),
    admin.from("rolls").select("*", { count: "exact", head: true }),
    admin.from("frames").select("*", { count: "exact", head: true }),
    admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_name", "first_export"),
  ]);

  const totalUsers = totalUsersRes.count ?? 0;
  const proUsers = proUsersRes.count ?? 0;

  return {
    totalUsers,
    proUsers,
    freeUsers: totalUsers - proUsers,
    waitlistUsers: waitlistRes.count ?? 0,
    totalRolls: rollsRes.count ?? 0,
    totalFrames: framesRes.count ?? 0,
    totalExports: exportsRes.count ?? 0,
  };
}
