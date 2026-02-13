import { type Page } from "@playwright/test";

/**
 * Wait for Supabase auth state to be available in React components.
 *
 * Components using useUserId() call supabase.auth.getUser() asynchronously
 * when they mount. This helper ensures the Supabase singleton has resolved
 * the auth state before tests interact with forms that use userId.
 */
export async function waitForAuth(page: Page) {
  // First, wait for the user menu button (shows email) to confirm
  // the Supabase singleton has resolved the auth session at page level.
  try {
    await page.getByRole("button", { name: /@/ }).waitFor({
      state: "visible",
      timeout: 10_000,
    });
  } catch {
    // On login page or other pages without user menu, skip this check
  }

  // Then wait for React effects to propagate. When a new component
  // mounts (e.g., CameraForm in a dialog), its useUserId() hook fires
  // onAuthStateChange which resolves from the cached singleton session.
  await page.waitForTimeout(500);
}
