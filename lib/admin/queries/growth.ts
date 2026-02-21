import type { SupabaseClient } from "@supabase/supabase-js";

export interface WeeklyGrowthPoint {
  week: string; // ISO week label, e.g. "2026-W08"
  signups: number;
  confirmations: number;
}

export async function fetchUserGrowth(
  admin: SupabaseClient,
): Promise<WeeklyGrowthPoint[]> {
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const [signupsRes, confirmationsRes] = await Promise.all([
    admin
      .from("analytics_events")
      .select("created_at")
      .eq("event_name", "signup_started")
      .gte("created_at", twelveWeeksAgo.toISOString())
      .order("created_at", { ascending: true }),
    admin
      .from("analytics_events")
      .select("created_at")
      .eq("event_name", "email_confirmed")
      .gte("created_at", twelveWeeksAgo.toISOString())
      .order("created_at", { ascending: true }),
  ]);

  const signups = signupsRes.data ?? [];
  const confirmations = confirmationsRes.data ?? [];

  // Bucket by ISO week
  const weekMap = new Map<string, { signups: number; confirmations: number }>();

  for (const row of signups) {
    const week = toIsoWeek(new Date(row.created_at));
    const entry = weekMap.get(week) ?? { signups: 0, confirmations: 0 };
    entry.signups++;
    weekMap.set(week, entry);
  }

  for (const row of confirmations) {
    const week = toIsoWeek(new Date(row.created_at));
    const entry = weekMap.get(week) ?? { signups: 0, confirmations: 0 };
    entry.confirmations++;
    weekMap.set(week, entry);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({ week, ...data }));
}

function toIsoWeek(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
