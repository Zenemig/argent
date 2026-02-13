import { test, expect } from "@playwright/test";
import {
  createCamera,
  createLens,
  editCamera,
  editLens,
  deleteCamera,
  deleteLens,
  deleteFilm,
  gotoGear,
} from "../helpers/gear";
import { waitForAuth } from "../helpers/auth";

test.describe("Gear Management", () => {
  test("add camera → verify it appears", async ({ page }) => {
    await createCamera(page, { name: "E2E Leica M6", make: "Leica" });
    await expect(page.getByText("E2E Leica M6").first()).toBeVisible();
  });

  test("edit camera name", async ({ page }) => {
    await createCamera(page, { name: "E2E Olympus OM-1", make: "Olympus" });

    await editCamera(page, "E2E Olympus OM-1", "E2E Olympus OM-1n");

    await expect(page.getByText("E2E Olympus OM-1n").first()).toBeVisible();
  });

  test("delete camera", async ({ page }) => {
    await createCamera(page, { name: "E2E Pentax K1000", make: "Pentax" });

    // deleteCamera navigates to /gear, finds the card, clicks delete, confirms
    await deleteCamera(page, "E2E Pentax K1000");

    // Verify the deleted camera no longer appears after a fresh navigation
    await page.goto("/gear", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    // Wait for camera list to load from Dexie
    await page.waitForTimeout(1500);

    const cards = page.locator("[data-slot='card']").filter({ hasText: "E2E Pentax K1000" });
    await expect(cards).toHaveCount(0, { timeout: 5_000 });
  });

  test("add lens → verify it appears", async ({ page }) => {
    await createCamera(page, { name: "E2E Nikon F3", make: "Nikon" });

    await createLens(page, {
      name: "E2E Nikkor 50mm f/1.4",
      make: "Nikon",
      focalLength: 50,
      maxAperture: 1.4,
    });

    await expect(page.getByText("E2E Nikkor 50mm f/1.4").first()).toBeVisible();
  });

  test("add custom film stock", async ({ page }) => {
    await gotoGear(page);

    await page.getByRole("tab", { name: /Films/i }).click();
    await page.getByRole("button", { name: /Add Custom Film/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await waitForAuth(page);

    await page.getByLabel(/^Brand$/i).fill("E2E Film Co");
    await page.getByLabel(/^Name$/i).fill("E2E Portra 800");
    await page.getByLabel(/^ISO$/i).fill("800");

    await page.getByRole("button", { name: /^Add$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    await expect(page.getByText("E2E Portra 800").first()).toBeVisible();
  });

  test("edit lens name", async ({ page }) => {
    await createCamera(page, { name: "E2E Minolta X-700", make: "Minolta" });

    await createLens(page, {
      name: "E2E MC Rokkor 50mm f/1.4",
      make: "Minolta",
      focalLength: 50,
      maxAperture: 1.4,
    });

    await editLens(page, "E2E MC Rokkor 50mm f/1.4", "E2E MC Rokkor 58mm f/1.2");

    await expect(page.getByText("E2E MC Rokkor 58mm f/1.2").first()).toBeVisible();
  });

  test("delete lens", async ({ page }) => {
    await createCamera(page, { name: "E2E Pentax MX", make: "Pentax" });

    await createLens(page, {
      name: "E2E SMC Takumar 55mm",
      make: "Pentax",
      focalLength: 55,
      maxAperture: 1.8,
    });

    await deleteLens(page, "E2E SMC Takumar 55mm");

    // Verify the deleted lens no longer appears after a fresh navigation
    await page.goto("/gear", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    await page.getByRole("tab", { name: /Lenses/i }).click();
    await page.waitForTimeout(1500);

    const cards = page.locator("[data-slot='card']").filter({ hasText: "E2E SMC Takumar 55mm" });
    await expect(cards).toHaveCount(0, { timeout: 5_000 });
  });

  test("delete custom film", async ({ page }) => {
    // Use unique name to avoid sync contamination from previous test runs
    const filmName = `E2E Deletable ${Date.now()}`;

    await gotoGear(page);

    // Create a custom film first
    await page.getByRole("tab", { name: /Films/i }).click();
    await page.getByRole("button", { name: /Add Custom Film/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await waitForAuth(page);

    await page.getByLabel(/^Brand$/i).fill("E2E Delete Co");
    await page.getByLabel(/^Name$/i).fill(filmName);
    await page.getByLabel(/^ISO$/i).fill("400");

    await page.getByRole("button", { name: /^Add$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText(filmName).first()).toBeVisible();

    // Delete the custom film
    await deleteFilm(page, filmName);

    // Verify the deleted film no longer appears after a fresh navigation
    await page.goto("/gear", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    await page.getByRole("tab", { name: /Films/i }).click();
    await page.waitForTimeout(2000);

    const cards = page.locator("[data-slot='card']").filter({ hasText: filmName });
    await expect(cards).toHaveCount(0, { timeout: 10_000 });
  });
});
