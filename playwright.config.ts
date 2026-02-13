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
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
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
      use: { ...devices["Pixel 5"] },
      testIgnore: /\.auth\./,
    },

    // Authenticated tests — depend on setup, use saved auth state
    {
      name: "chromium-auth",
      use: { ...devices["Desktop Chrome"], storageState: authFile },
      dependencies: ["setup"],
      testMatch: /\.auth\./,
    },
    {
      name: "mobile-chrome-auth",
      use: { ...devices["Pixel 5"], storageState: authFile },
      dependencies: ["setup"],
      testMatch: /\.auth\./,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
