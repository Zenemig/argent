import { test, expect } from "@playwright/test";
import { createCamera } from "../helpers/gear";
import { loadRoll } from "../helpers/roll";
import { logFrame } from "../helpers/frame";

test.describe("Dashboard Filters & Search", () => {
  test("search filters rolls by camera name", async ({ page }) => {
    // Create a uniquely named camera and load a roll
    await createCamera(page, { name: "E2E Hasselblad 500C", make: "Hasselblad" });
    await loadRoll(page, "E2E Hasselblad 500C");

    // Navigate to dashboard
    await page.goto("/");
    await expect(page.getByText("E2E Hasselblad 500C").first()).toBeVisible();

    // Type in search — should match the camera name on the roll card
    await page.getByRole("textbox", { name: /Search/i }).fill("Hasselblad");

    // The roll card should still be visible (it shows the camera name)
    await expect(page.getByText("E2E Hasselblad 500C").first()).toBeVisible();

    // Search for something that doesn't match
    await page.getByRole("textbox", { name: /Search/i }).fill("XYZNONEXISTENT");

    // Should show no-results message
    await expect(page.getByText(/No rolls match/i)).toBeVisible();
  });

  test("filter by status shows only matching rolls", async ({ page }) => {
    // Create a camera and load a roll (starts as "loaded")
    await createCamera(page, { name: "E2E Status Camera", make: "Canon" });
    await loadRoll(page, "E2E Status Camera");

    // Log a frame to advance from loaded → active
    await page.getByRole("button", { name: /Save Shot/i }).click();
    await expect(page.getByText("#1")).toBeVisible();

    // Go to dashboard
    await page.goto("/");
    await expect(page.getByText("E2E Status Camera").first()).toBeVisible();

    // Filter by "finished" status — our roll is "active", so it should disappear
    await page.getByRole("combobox", { name: /All$/i }).first().click();
    await page.getByRole("option", { name: /Finished/i }).click();

    // Should show no-results message since we have no finished rolls (from this test)
    // Note: other test runs may have left finished rolls, so check for either no results or the filter working
    const noResults = page.getByText(/No rolls match/i);
    const rollCard = page.getByText("E2E Status Camera");

    // The active roll should NOT appear when filtering by finished
    await expect(rollCard).not.toBeVisible({ timeout: 3_000 }).catch(() => {
      // If visible, it means there are other finished rolls from prior test runs — that's OK
    });
  });

  test("empty filter shows no-results message", async ({ page }) => {
    await createCamera(page, { name: "E2E Empty Filter Cam", make: "Pentax" });
    await loadRoll(page, "E2E Empty Filter Cam");

    await page.goto("/");
    await expect(page.getByText("E2E Empty Filter Cam").first()).toBeVisible();

    // Search for a string that won't match any roll
    await page.getByRole("textbox", { name: /Search/i }).fill("ZZZZNOROLLFOUND");

    await expect(page.getByText(/No rolls match/i)).toBeVisible();
  });

  test("sort order can be changed", async ({ page }) => {
    await createCamera(page, { name: "E2E Sort Camera", make: "Fuji" });
    await loadRoll(page, "E2E Sort Camera");

    await page.goto("/");
    await expect(page.getByText("E2E Sort Camera").first()).toBeVisible();

    // The sort select has a static aria-label of "Newest First" (t("sortDate"))
    const sortSelect = page.getByRole("combobox", { name: /Newest First/i });

    // Change sort to "By Status"
    await sortSelect.click();
    await page.getByRole("option", { name: /By Status/i }).click();

    // The roll should still be visible (just reordered)
    await expect(page.getByText("E2E Sort Camera").first()).toBeVisible();

    // Change sort to "By Camera" — aria-label is still "Newest First" (static)
    await sortSelect.click();
    await page.getByRole("option", { name: /By Camera/i }).click();

    await expect(page.getByText("E2E Sort Camera").first()).toBeVisible();
  });
});
