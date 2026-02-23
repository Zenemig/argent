import { test, expect } from "@playwright/test";
import { createCamera } from "../helpers/gear";
import { loadRoll } from "../helpers/roll";
import { logFrame } from "../helpers/frame";
import { goOffline, goOnline, waitForSync } from "../helpers/network";
import { waitForAuth } from "../helpers/auth";
import { dismissDevOverlay } from "../helpers/utils";

test.describe("Offline Resilience & Sync", () => {
  test("log frames offline → go online → verify data persists", async ({
    page,
  }) => {
    // Setup: create camera and load roll while online
    await createCamera(page, { name: "E2E Offline Cam", make: "Test" });
    const rollId = await loadRoll(page, "E2E Offline Cam");

    // Dismiss any dev overlay before going offline
    await dismissDevOverlay(page);

    // Wait for sync to complete before going offline
    await waitForSync(page);

    // Go offline (blocks Supabase, keeps dev server alive)
    await goOffline(page);

    // Log 3 frames while offline
    await logFrame(page, "Offline shot 1");
    await logFrame(page, "Offline shot 2");
    await logFrame(page, "Offline shot 3");

    // Verify frames appear locally
    await expect(page.getByText("#3")).toBeVisible();

    // Go back online
    await goOnline(page);

    // Wait for sync to complete
    await waitForSync(page);

    // Reload page to confirm data persisted through sync
    await page.reload();
    await expect(page.getByText("#3")).toBeVisible();
    await expect(page.getByText("Offline shot 1")).toBeVisible();
  });

  test("gear created offline persists after going online", async ({
    page,
  }) => {
    // Navigate to gear and wait for auth to fully resolve before going offline
    await page.goto("/gear");
    await expect(page.getByRole("button", { name: /Add Camera/i })).toBeVisible();
    await waitForAuth(page);
    await dismissDevOverlay(page);

    // Wait for sync to complete before going offline
    await waitForSync(page);

    // Go offline (blocks Supabase, keeps dev server alive)
    await goOffline(page);

    // Create camera while offline
    await page.getByRole("button", { name: /Add Camera/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel(/^Name$/i).fill("E2E Offline Camera");
    await page.getByLabel(/^Make$/i).fill("Offline Brand");
    await page.getByRole("button", { name: /^Add$/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Camera should be visible locally
    await expect(page.getByText("E2E Offline Camera").first()).toBeVisible();

    // Go back online and wait for sync
    await goOnline(page);
    await waitForSync(page);

    // Reload to verify persistence
    await page.reload();
    await expect(page.getByText("E2E Offline Camera").first()).toBeVisible();
  });
});
