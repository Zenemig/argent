import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnalyticsEvent } from "@/lib/constants";

/**
 * Server-side analytics event tracking.
 * Inserts directly into analytics_events table.
 * Silently handles unique constraint violations (fire-once semantics).
 */
export async function trackEventServer(
  supabase: SupabaseClient,
  userId: string,
  eventName: AnalyticsEvent,
  metadata?: Record<string, unknown>,
) {
  const { error } = await supabase.from("analytics_events").insert({
    user_id: userId,
    event_name: eventName,
    metadata: metadata ?? {},
  });

  // 23505 = unique_violation — event already recorded, expected behavior
  if (error && error.code !== "23505") {
    console.error("[analytics] Failed to track event:", eventName, error);
  }
}
