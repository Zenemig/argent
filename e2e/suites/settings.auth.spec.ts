import { test, expect } from "@playwright/test";

test.describe("Settings Persistence", () => {
  test("theme change applies immediately", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();

    // Change theme to "light"
    await page.getByRole("combobox", { name: /Theme/i }).click();
    await page.getByRole("option", { name: /Light/i }).click();

    // Verify <html> element has "light" class (applied immediately via applyTheme)
    await expect(page.locator("html")).toHaveClass(/light/);

    // Verify the select shows "Light" as the current value
    await expect(page.getByRole("combobox", { name: /Theme/i })).toHaveText(/Light/i);

    // Reset back to dark for other tests
    await page.getByRole("combobox", { name: /Theme/i }).click();
    await page.getByRole("option", { name: /Dark/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("display name saves on blur", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();

    // Fill display name and blur
    const displayNameInput = page.getByPlaceholder(/Display Name/i);
    await displayNameInput.fill("E2E Test Photographer");
    await displayNameInput.blur();

    // Reload and verify persisted
    await page.reload();
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();

    // Wait for settings to load from IndexedDB
    await page.waitForTimeout(1000);
    await expect(page.getByPlaceholder(/Display Name/i)).toHaveValue("E2E Test Photographer");
  });

  test("copyright saves on blur", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();

    // Fill copyright and blur
    const copyrightInput = page.getByPlaceholder("© 2026 Your Name");
    await copyrightInput.fill("© 2026 E2E Tester");
    await copyrightInput.blur();

    // Reload and verify persisted
    await page.reload();
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();
    await page.waitForTimeout(1000);

    await expect(page.getByPlaceholder("© 2026 Your Name")).toHaveValue("© 2026 E2E Tester");
  });

  test("version number displayed", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();

    await expect(page.getByText("0.1.0")).toBeVisible();
  });
});
