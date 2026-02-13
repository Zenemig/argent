import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("Accessibility — public routes (axe-core WCAG 2.1 AA)", () => {
  test("landing page has no violations", async ({ page }) => {
    await page.goto("/");

    // Exclude color-contrast: axe-core cannot parse oklch() color values
    // (Tailwind v4 default). On the landing page hero with background image
    // layers, axe falls back to incorrect color compositing, producing
    // false-positive contrast violations. Theme colors have verified
    // WCAG AA contrast ratios (primary/primary-foreground > 15:1).
    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .disableRules(["color-contrast"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("login page has no violations", async ({ page }) => {
    await page.goto("/login");

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
