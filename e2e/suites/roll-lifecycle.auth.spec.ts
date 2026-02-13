import { test, expect } from "@playwright/test";
import { createCamera } from "../helpers/gear";
import { loadRoll, advanceRollStatus } from "../helpers/roll";
import { logFrames } from "../helpers/frame";

test.describe("Full Roll Lifecycle", () => {
  test("create camera → load roll → log 5 frames → finish → develop → scan → archive → export", async ({
    page,
  }) => {
    // 1. Create a camera
    await createCamera(page, { name: "E2E Nikon FM2", make: "Nikon" });

    // 2. Load a roll with that camera
    const rollId = await loadRoll(page, "E2E Nikon FM2");
    expect(rollId).toBeTruthy();

    // Verify we're on the roll detail page with the camera name visible
    await expect(page.getByText("E2E Nikon FM2").first()).toBeVisible();

    // 3. Log 5 frames
    await logFrames(page, 5);

    // Verify 5 frame badges exist in the timeline
    await expect(page.getByText("#5")).toBeVisible();

    // 4. Advance through the roll lifecycle
    // active → finished (logging the first frame auto-advances loaded → active)
    await advanceRollStatus(page, "Finish Roll");

    // finished → developed (opens lab dialog)
    await advanceRollStatus(page, "Mark Developed");

    // developed → scanned
    await advanceRollStatus(page, "Mark Scanned");

    // scanned → archived
    await advanceRollStatus(page, "Archive");

    // 5. Verify the "Export" button appears (only visible on scanned/archived)
    const exportButton = page.getByRole("button", { name: /Export/i });
    await expect(exportButton).toBeVisible();

    // 6. Open export dropdown and trigger JSON export (simplest to verify)
    await exportButton.click();
    const jsonOption = page.getByRole("menuitem", { name: /JSON/i });
    await expect(jsonOption).toBeVisible();
    await jsonOption.click();

    // 7. Export dialog appears — click export with default pattern
    await expect(page.getByRole("dialog")).toBeVisible();

    // Intercept the download
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("dialog").getByRole("button", { name: /^Export$/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test("roll status can be undone", async ({ page }) => {
    await createCamera(page, { name: "E2E Canon AE-1", make: "Canon" });

    const rollId = await loadRoll(page, "E2E Canon AE-1");

    // Log a frame to advance from loaded → active
    await page.getByRole("button", { name: /Save Shot/i }).click();
    await expect(page.getByText("#1")).toBeVisible();

    // Advance to finished
    await advanceRollStatus(page, "Finish Roll");

    // Undo back to active
    await page.getByRole("button", { name: /Undo/i }).click();

    // The "Finish Roll" button should reappear
    await expect(
      page.getByRole("button", { name: /Finish Roll/i }),
    ).toBeVisible();
  });

  test("export XMP sidecar as ZIP", async ({ page }) => {
    await createCamera(page, { name: "E2E XMP Camera", make: "Nikon" });
    const rollId = await loadRoll(page, "E2E XMP Camera");

    await logFrames(page, 3);
    await advanceRollStatus(page, "Finish Roll");
    await advanceRollStatus(page, "Mark Developed");
    await advanceRollStatus(page, "Mark Scanned");

    // Click export dropdown and select XMP
    const exportButton = page.getByRole("button", { name: /Export/i });
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    await page.getByRole("menuitem", { name: /XMP/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("dialog").getByRole("button", { name: /^Export$/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });

  test("export CSV", async ({ page }) => {
    await createCamera(page, { name: "E2E CSV Camera", make: "Canon" });
    const rollId = await loadRoll(page, "E2E CSV Camera");

    await logFrames(page, 2);
    await advanceRollStatus(page, "Finish Roll");
    await advanceRollStatus(page, "Mark Developed");
    await advanceRollStatus(page, "Mark Scanned");

    const exportButton = page.getByRole("button", { name: /Export/i });
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    await page.getByRole("menuitem", { name: /CSV/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("dialog").getByRole("button", { name: /^Export$/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test("export ExifTool script as ZIP", async ({ page }) => {
    await createCamera(page, { name: "E2E Script Camera", make: "Olympus" });
    const rollId = await loadRoll(page, "E2E Script Camera");

    await logFrames(page, 2);
    await advanceRollStatus(page, "Finish Roll");
    await advanceRollStatus(page, "Mark Developed");
    await advanceRollStatus(page, "Mark Scanned");

    const exportButton = page.getByRole("button", { name: /Export/i });
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    await page.getByRole("menuitem", { name: /Script/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("dialog").getByRole("button", { name: /^Export$/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);
  });

  test("discard roll with reason", async ({ page }) => {
    await createCamera(page, { name: "E2E Discard Camera", make: "Leica" });
    const rollId = await loadRoll(page, "E2E Discard Camera");

    // Log a frame so the roll becomes active
    await page.getByRole("button", { name: /Save Shot/i }).click();
    await expect(page.getByText("#1")).toBeVisible();

    // Open the actions menu (ghost icon button with DropdownMenu trigger)
    await page.locator("[data-slot='dropdown-menu-trigger'][data-variant='ghost'][data-size='icon']").click();

    // Click "Discard Roll"
    await page.getByRole("menuitem", { name: /Discard Roll/i }).click();

    // Discard dialog appears
    await expect(page.getByRole("dialog")).toBeVisible();

    // Select a reason (light_leak) — click the radio button
    await page.locator("#reason-light_leak").click();

    // Click the destructive "Discard Roll" confirm button
    await page.getByRole("dialog").getByRole("button", { name: /Discard Roll/i }).click();

    // Dialog closes and the roll should show a "Discarded" status badge
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText("Discarded", { exact: true })).toBeVisible();
  });
});
