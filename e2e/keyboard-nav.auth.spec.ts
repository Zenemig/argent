import { test, expect } from "@playwright/test";

test.describe("Keyboard Navigation — authenticated desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("skip link exists and navigates to main content", async ({ page }) => {
    await page.goto("/gear");

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Focus the skip link directly (Tab order varies in dev mode due to Next.js dev tools)
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("sidebar nav has aria-label", async ({ page }) => {
    await page.goto("/gear");

    const nav = page.locator("aside nav");
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute("aria-label");
  });

  test("sidebar nav marks active page with aria-current", async ({
    page,
  }) => {
    await page.goto("/gear");

    const activeLink = page.locator('aside nav a[aria-current="page"]');
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toHaveText(/Gear/i);

    // Other links should not have aria-current
    const inactiveLinks = page.locator(
      "aside nav a:not([aria-current])",
    );
    const count = await inactiveLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("sidebar nav links are keyboard focusable", async ({ page }) => {
    await page.goto("/gear");

    const navLinks = page.locator("aside nav a");
    // Wait for sidebar to render
    await expect(navLinks.first()).toBeVisible();
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      await link.focus();
      await expect(link).toBeFocused();
    }
  });

  test("all app pages have an h1 heading", async ({ page }) => {
    for (const path of ["/gear", "/settings", "/stats"]) {
      await page.goto(path);
      const h1 = page.locator("h1");
      await expect(h1.first()).toBeVisible();
    }
  });

  test("all app pages have #main-content landmark", async ({ page }) => {
    for (const path of ["/", "/gear", "/settings", "/stats"]) {
      await page.goto(path);
      await expect(page.locator("#main-content")).toBeVisible();
    }
  });
});

test.describe("Keyboard Navigation — authenticated mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("skip link exists and navigates to main content", async ({ page }) => {
    await page.goto("/gear");

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("bottom nav has aria-label", async ({ page }) => {
    await page.goto("/gear");

    // Target the bottom nav specifically (it has class "fixed" on the nav itself,
    // unlike the sidebar nav which is inside an aside element)
    const bottomNav = page.locator("nav.fixed");
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav).toHaveAttribute("aria-label");
  });

  test("bottom nav marks active page with aria-current", async ({
    page,
  }) => {
    await page.goto("/gear");

    // Use bottom nav specific selector to avoid matching sidebar nav links
    const activeLink = page.locator('nav.fixed a[aria-current="page"]');
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toHaveText(/Gear/i);
  });

  test("bottom nav links are keyboard focusable", async ({ page }) => {
    await page.goto("/gear");

    const navLinks = page.locator("nav.fixed a");
    await expect(navLinks.first()).toBeVisible();
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      await link.focus();
      await expect(link).toBeFocused();
    }
  });
});
