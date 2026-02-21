import type { AnalyticsEvent } from "@/lib/constants";

/**
 * Fire-and-forget client-side analytics event.
 * Silently fails if offline or the request errors.
 */
export function trackEvent(
  eventName: AnalyticsEvent,
  metadata?: Record<string, unknown>,
) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_name: eventName, metadata }),
  }).catch(() => {
    // Silent — analytics should never block UX
  });
}
