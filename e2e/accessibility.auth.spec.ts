import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("Accessibility — authenticated routes (axe-core WCAG 2.1 AA)", () => {
  test("dashboard has no violations", async ({ page }) => {
    await page.goto("/");
    // Authenticated users see the dashboard, not the marketing page
    await expect(page.locator("#main-content")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("gear page has no violations", async ({ page }) => {
    await page.goto("/gear");
    await expect(page.locator("h1").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("settings page has no violations", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h1").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("stats page has no violations", async ({ page }) => {
    await page.goto("/stats");
    await expect(page.locator("h1").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
