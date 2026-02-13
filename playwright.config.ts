import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Load .env.local so E2E_USER_EMAIL / E2E_USER_PASSWORD are available
loadEnvConfig(process.cwd());

const authFile = "playwright/.auth/user.json";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // Auth setup — runs once, saves session for other projects
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // Public tests — no auth required (landing, login pages)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /\.auth\./,
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"], // 412x915
      },
      testIgnore: /\.auth\./,
    },

    // Authenticated tests — depend on setup, use saved auth state
    // Excludes auth-flow tests which sign out and revoke the session
    {
      name: "chromium-auth",
      use: { ...devices["Desktop Chrome"], storageState: authFile },
      dependencies: ["setup"],
      testMatch: /\.auth\./,
      testIgnore: /auth-flow/,
    },
    {
      name: "mobile-chrome-auth",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 }, // iPhone 14 — tests both viewports across projects
        storageState: authFile,
      },
      dependencies: ["setup"],
      testMatch: /\.auth\./,
      testIgnore: /auth-flow/,
    },

    // WebKit — public tests on Desktop Safari
    // Excludes keyboard-nav tests (WebKit Tab focus model differs from Chromium)
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: [/\.auth\./, /keyboard-nav/],
    },

    // WebKit — authenticated tests on Desktop Safari
    // Excludes keyboard-nav (focus model) and roll-lifecycle (download events
    // don't fire — Safari uses Web Share API which bypasses Playwright's download interception)
    {
      name: "webkit-auth",
      use: { ...devices["Desktop Safari"], storageState: authFile },
      dependencies: ["setup"],
      testMatch: /\.auth\./,
      testIgnore: [/auth-flow/, /keyboard-nav/, /roll-lifecycle/],
    },

    // Auth-flow tests sign out the user, revoking the Supabase refresh token.
    // Must run AFTER all other auth tests to avoid invalidating the shared session.
    {
      name: "chromium-auth-destructive",
      use: { ...devices["Desktop Chrome"], storageState: authFile },
      dependencies: ["setup", "chromium-auth"],
      testMatch: /auth-flow\.auth\./,
    },
  ],
  webServer: {
    command: process.env.CI ? "npm start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
