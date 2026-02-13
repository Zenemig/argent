import { type Page, expect } from "@playwright/test";
import { waitForAuth } from "./auth";

/**
 * Load a new roll via the dashboard wizard.
 * Picks the first matching camera and first available film stock.
 * Returns the roll ID extracted from the URL.
 */
export async function loadRoll(
  page: Page,
  cameraName: string,
): Promise<string> {
  await page.goto("/");

  // Click the header "Load New Roll" button (there's also one in the empty state)
  await page.getByRole("button", { name: /Load New Roll/i }).first().click();

  // Step 1: Select camera — click the card containing the camera name
  // Use .first() to handle duplicates from prior test runs synced from Supabase
  await expect(page.getByRole("dialog")).toBeVisible();
  await waitForAuth(page);
  await page.getByRole("dialog").getByText(cameraName).first().click();

  // Step 2: Select film — pick the first available film stock
  // Film options show "ISO {number}" in their description
  const filmOption = page.getByRole("dialog").getByText(/ISO \d+/).first();
  await expect(filmOption).toBeVisible();
  await filmOption.click();

  // Step 3: Configure — click the "Load New Roll" button in the configure step
  await page.getByRole("dialog").getByRole("button", { name: /Load New Roll/i }).click();

  // Wait for navigation to roll detail page
  await page.waitForURL(/\/roll\/[A-Za-z0-9]+/);

  // Extract roll ID from URL
  const url = page.url();
  const rollId = url.split("/roll/")[1];
  return rollId;
}

/**
 * Advance roll status by clicking the primary action button.
 * Handles the "Mark Developed" dialog that requires lab name confirmation.
 */
export async function advanceRollStatus(
  page: Page,
  actionText: string,
) {
  await page.getByRole("button", { name: new RegExp(actionText, "i") }).click();

  // If this is the "Mark Developed" action, fill the develop dialog
  if (/develop/i.test(actionText)) {
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel(/Lab Name/i).fill("Test Lab");
    await page.getByRole("button", { name: /Confirm/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
}
