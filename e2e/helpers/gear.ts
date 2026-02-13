import { type Page, expect } from "@playwright/test";
import { waitForAuth } from "./auth";

/**
 * Navigate to /gear and ensure the page has loaded.
 */
export async function gotoGear(page: Page) {
  await page.goto("/gear");
  await expect(page.locator("h1")).toBeVisible();
}

/**
 * Create a camera via the gear page dialog.
 * Fills only the required fields (name, make) and leaves optional fields at defaults.
 */
export async function createCamera(
  page: Page,
  data: { name: string; make: string },
) {
  await gotoGear(page);

  // Cameras tab is the default
  await page.getByRole("button", { name: /Add Camera/i }).click();

  // Wait for dialog and for CameraForm's useUserId() to resolve
  await expect(page.getByRole("dialog")).toBeVisible();
  await waitForAuth(page);

  await page.getByLabel(/^Name$/i).fill(data.name);
  await page.getByLabel(/^Make$/i).fill(data.make);

  // Submit — button text is "Add" for new cameras
  await page.getByRole("button", { name: /^Add$/i }).click();

  // Wait for dialog to close
  await expect(page.getByRole("dialog")).not.toBeVisible();

  // Verify camera appears (use .first() in case of duplicates from prior sync)
  await expect(page.getByText(data.name).first()).toBeVisible();
}

/**
 * Create a lens via the gear page dialog.
 */
export async function createLens(
  page: Page,
  data: { name: string; make: string; focalLength: number; maxAperture: number },
) {
  await gotoGear(page);

  await page.getByRole("tab", { name: /Lenses/i }).click();
  await page.getByRole("button", { name: /Add Lens/i }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await waitForAuth(page);

  await page.getByLabel(/^Name$/i).fill(data.name);
  await page.getByLabel(/^Make$/i).fill(data.make);
  await page.getByLabel(/Focal Length/i).fill(String(data.focalLength));
  await page.getByLabel(/Max Aperture/i).fill(String(data.maxAperture));

  await page.getByRole("button", { name: /^Add$/i }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText(data.name).first()).toBeVisible();
}

/**
 * Edit a camera: opens the edit dialog, clears the name, types the new name, saves.
 */
export async function editCamera(page: Page, oldName: string, newName: string) {
  await gotoGear(page);

  // Find the first card containing the camera name (duplicates possible from prior sync)
  const card = page.locator("[data-slot='card']").filter({ hasText: oldName }).first();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Edit" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await waitForAuth(page);

  const nameInput = page.getByLabel(/^Name$/i);
  await nameInput.clear();
  await nameInput.fill(newName);

  await page.getByRole("button", { name: /^Save$/i }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText(newName).first()).toBeVisible();
}

/**
 * Delete a camera via the gear page.
 */
export async function deleteCamera(page: Page, name: string) {
  await gotoGear(page);

  // Find the first card containing the camera name (duplicates possible from prior sync)
  const card = page.locator("[data-slot='card']").filter({ hasText: name }).first();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Delete" }).click();

  // Confirm deletion in alert dialog
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: /^Delete$/i }).click();

  // Wait for the alert dialog to close (confirms deletion completed)
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
}

/**
 * Edit a lens: navigates to Lenses tab, opens the edit dialog, changes the name, saves.
 */
export async function editLens(page: Page, oldName: string, newName: string) {
  await gotoGear(page);

  await page.getByRole("tab", { name: /Lenses/i }).click();

  const card = page.locator("[data-slot='card']").filter({ hasText: oldName }).first();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Edit" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await waitForAuth(page);

  const nameInput = page.getByLabel(/^Name$/i);
  await nameInput.clear();
  await nameInput.fill(newName);

  await page.getByRole("button", { name: /^Save$/i }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText(newName).first()).toBeVisible();
}

/**
 * Delete a lens via the gear page.
 */
export async function deleteLens(page: Page, name: string) {
  await gotoGear(page);

  await page.getByRole("tab", { name: /Lenses/i }).click();

  const card = page.locator("[data-slot='card']").filter({ hasText: name }).first();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: /^Delete$/i }).click();
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
}

/**
 * Delete a custom film via the gear page.
 */
export async function deleteFilm(page: Page, name: string) {
  await gotoGear(page);

  await page.getByRole("tab", { name: /Films/i }).click();

  const card = page.locator("[data-slot='card']").filter({ hasText: name }).first();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Delete" }).click();

  // Confirm deletion in alert dialog
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: /^Delete$/i }).click();

  // Wait for the alert dialog to close (confirms deletion completed)
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
}
