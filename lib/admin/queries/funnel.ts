import type { SupabaseClient } from "@supabase/supabase-js";

export interface FunnelStep {
  step: string;
  count: number;
  dropOff: number | null; // percentage drop from previous step, null for first
}

const FUNNEL_STEPS = [
  { step: "Signed up", event: "signup_started" },
  { step: "Email confirmed", event: "email_confirmed" },
  { step: "First camera", event: "first_camera_added" },
  { step: "First roll loaded", event: "first_roll_loaded" },
  { step: "First frame logged", event: "first_frame_logged" },
  { step: "First export", event: "first_export" },
] as const;

export async function fetchFunnelData(
  admin: SupabaseClient,
): Promise<FunnelStep[]> {
  const counts = await Promise.all(
    FUNNEL_STEPS.map(({ event }) =>
      admin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", event),
    ),
  );

  const steps: FunnelStep[] = [];
  let prev: number | null = null;

  for (let i = 0; i < FUNNEL_STEPS.length; i++) {
    const count = counts[i].count ?? 0;
    const dropOff =
      prev !== null && prev > 0
        ? Math.round(((prev - count) / prev) * 100)
        : null;
    steps.push({ step: FUNNEL_STEPS[i].step, count, dropOff });
    prev = count;
  }

  return steps;
}
