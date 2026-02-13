import { type Page, expect } from "@playwright/test";

/**
 * Log a single frame using the shot logger controls.
 * Uses default shutter speed and aperture values already selected.
 * Optionally adds a note to the frame.
 */
export async function logFrame(page: Page, note?: string) {
  if (note) {
    await page.getByPlaceholder(/Quick Note/i).fill(note);
  }

  await page.getByRole("button", { name: /Save Shot/i }).click();

  // Clear the note field after save (the component does this automatically,
  // but we wait for the toast to confirm the frame was saved)
  await expect(page.getByText(/Frame \d+/i).last()).toBeVisible();
}

/**
 * Log multiple frames in sequence.
 */
export async function logFrames(page: Page, count: number) {
  for (let i = 1; i <= count; i++) {
    await logFrame(page, `Shot ${i}`);
  }
}

/**
 * Assert that the frame timeline shows exactly `count` frames.
 */
export async function assertFrameCount(page: Page, count: number) {
  // Frame badges show "#N" pattern
  const frameBadges = page.locator('div:has(> span:text("#"))').filter({
    has: page.locator("span"),
  });
  // More reliable: count elements with the frame number badge
  const badges = page.getByText(/^#\d+$/).all();
  const actual = (await badges).length;
  expect(actual).toBe(count);
}
