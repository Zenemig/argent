import { test, expect } from "@playwright/test";

test.describe("Keyboard Navigation", () => {
  test("skip link appears on Tab and navigates to main content", async ({
    page,
  }) => {
    await page.goto("/");

    // Press Tab to focus the skip link
    await page.keyboard.press("Tab");

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    // Pressing Enter should navigate to #main-content
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("skip link is present on login page", async ({ page }) => {
    await page.goto("/login");

    await page.keyboard.press("Tab");

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });

  test("landing page main content has skip link target", async ({ page }) => {
    await page.goto("/");
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeVisible();
  });

  test("login page main content has skip link target", async ({ page }) => {
    await page.goto("/login");
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeVisible();
  });

  test("landing page has an h1 heading", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();
  });

  test("landing page header links are keyboard focusable", async ({
    page,
  }) => {
    await page.goto("/");

    // Header links (GitHub, Log In, Sign Up)
    const headerLinks = page.locator("header a");
    const count = await headerLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = headerLinks.nth(i);
      await link.focus();
      await expect(link).toBeFocused();
    }
  });

  test("app pages redirect to login with skip link present", async ({
    page,
  }) => {
    // App routes require auth — verify login page still has a11y features
    await page.goto("/gear");
    await page.waitForURL(/login/);

    const skipLink = page.locator('a[href="#main-content"]');
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
  });
});
