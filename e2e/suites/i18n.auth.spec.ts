import { test, expect } from "@playwright/test";
import { waitForAuth } from "../helpers/auth";
import { dismissDevOverlay } from "../helpers/utils";

/**
 * Helper to set the NEXT_LOCALE cookie via Playwright context API.
 * Uses url-based cookie to avoid domain matching issues with localhost.
 */
async function setLocaleCookie(page: import("@playwright/test").Page, locale: "en" | "es") {
  await page.context().addCookies([{
    name: "NEXT_LOCALE",
    value: locale,
    url: "http://localhost:3000",
  }]);
}

test.describe("Internationalization (i18n)", () => {
  // Run i18n tests serially — they share cookie state
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    // Ensure we start in English
    await setLocaleCookie(page, "en");
  });

  test.afterEach(async ({ page }) => {
    // Always reset to English after each test
    await setLocaleCookie(page, "en");
  });

  test("switch to Spanish → UI text updates across all pages", async ({
    page,
  }) => {
    // Start on settings page in English
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /Settings/i })).toBeVisible();

    // Switch to Spanish via cookie and reload
    await setLocaleCookie(page, "es");
    await page.reload({ waitUntil: "networkidle" });

    // Verify settings page is in Spanish
    await expect(page.getByRole("heading", { name: /Ajustes/i })).toBeVisible({ timeout: 10_000 });

    // Navigate to dashboard — should also be in Spanish
    await page.goto("/");
    await dismissDevOverlay(page);
    await expect(page.getByRole("heading", { name: /Todos los Rollos/i })).toBeVisible({ timeout: 10_000 });

    // Navigate to gear — tab names should be in Spanish
    await page.goto("/gear");
    await expect(page.getByRole("tab", { name: /Cámaras/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Lentes/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Películas/i })).toBeVisible();

    // Navigate to stats — should be in Spanish
    await page.goto("/stats");
    await expect(page.getByRole("heading", { name: /Estadísticas/i })).toBeVisible();
  });

  test("core flows work in Spanish", async ({ page }) => {
    // Switch to Spanish via cookie
    await setLocaleCookie(page, "es");

    // Create a camera in Spanish
    await page.goto("/gear", { waitUntil: "networkidle" });
    await dismissDevOverlay(page);
    await expect(page.getByRole("heading", { name: /Equipo/i })).toBeVisible();
    await page.getByRole("button", { name: /Agregar Cámara/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await waitForAuth(page);

    await page.getByLabel(/^Nombre$/i).fill("E2E Cámara Español");
    await page.getByLabel(/^Marca$/i).fill("Prueba");
    // On mobile viewports, the dialog form may overflow and the submit button
    // can be partially covered by form fields above it. Use force click.
    await page.getByRole("button", { name: /^Agregar$/i }).click({ force: true });

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText("E2E Cámara Español").first()).toBeVisible();

    // Load a roll in Spanish — navigate to dashboard
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissDevOverlay(page);

    // Verify we're on the dashboard (not gear page)
    await expect(page.getByRole("heading", { name: /Todos los Rollos/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /Cargar Nuevo Rollo/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await waitForAuth(page);

    // Select the camera we just created
    await page.getByRole("dialog").getByText("E2E Cámara Español").first().click();

    // Select the first available film
    const filmOption = page
      .getByRole("dialog")
      .getByText(/ISO \d+/)
      .first();
    await expect(filmOption).toBeVisible();
    await filmOption.click();

    // Configure and load
    await page.getByRole("dialog").getByRole("button", { name: /Cargar Nuevo Rollo/i }).click();

    // Should navigate to roll detail
    await page.waitForURL(/\/roll\/[A-Za-z0-9]+/);

    // Verify Spanish labels on the shot logger
    await expect(page.getByRole("button", { name: /Guardar Foto/i })).toBeVisible({ timeout: 10_000 });
  });

  test("language preference persists across page navigations", async ({
    page,
  }) => {
    // Switch to Spanish via cookie
    await setLocaleCookie(page, "es");

    // Navigate through multiple pages — all should be in Spanish
    await page.goto("/gear");
    await expect(page.getByRole("heading", { name: /Equipo/i })).toBeVisible();

    await page.goto("/stats");
    await expect(page.getByRole("heading", { name: /Estadísticas/i })).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /Ajustes/i })).toBeVisible();
  });
});
