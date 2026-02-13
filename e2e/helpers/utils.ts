import { type Page } from "@playwright/test";

/**
 * Dismiss the Next.js dev overlay that can intercept pointer events.
 * In dev mode, error indicators from the overlay can block clicks on
 * underlying page elements.
 */
export async function dismissDevOverlay(page: Page) {
  await page.evaluate(() => {
    const portal = document.querySelector("nextjs-portal");
    if (portal) portal.remove();
  });
}
