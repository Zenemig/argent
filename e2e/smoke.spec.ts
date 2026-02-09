import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Argent/);
});

test("gear page loads", async ({ page }) => {
  await page.goto("/gear");
  await expect(page.locator("h1")).toBeVisible();
});
