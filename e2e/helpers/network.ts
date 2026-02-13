import { type Page, expect } from "@playwright/test";

/**
 * Simulate going offline by blocking Supabase API calls and
 * triggering the browser's offline event.
 *
 * We intentionally avoid `context.setOffline(true)` because it kills
 * the Next.js dev server HMR connection, crashing the page.
 * Instead, we block only external (Supabase) requests and fire the
 * offline event so the app's `useSync` hook transitions correctly.
 */
export async function goOffline(page: Page) {
  // Block all Supabase API calls
  await page.route(/supabase\.co/, (route) => route.abort());

  // Override navigator.onLine and dispatch offline event
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event("offline"));
  });
}

/**
 * Simulate going back online by removing route interception and
 * triggering the browser's online event.
 */
export async function goOnline(page: Page) {
  // Remove all route interceptions
  await page.unrouteAll({ behavior: "wait" });

  // Restore navigator.onLine and dispatch online event
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event("online"));
  });
}

/**
 * Wait for the sync indicator to show "All synced".
 * The sync status label is in an sr-only LiveRegion, so we check
 * the button's aria-label instead of visible text.
 */
export async function waitForSync(page: Page, timeout = 15_000) {
  // The sync button uses aria-label with the sync state text
  // "All synced" (en) or "Todo sincronizado" (es)
  await expect(
    page.getByRole("button", { name: /All synced|Todo sincronizado/i }),
  ).toBeVisible({ timeout });
}
