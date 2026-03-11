import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for SessionLens E2E tests.
 * Debug path tests use local video fixtures.
 * @see https://playwright.dev/docs/test-configuration
 *
 * To always record video (for debugging blank recordings):
 *   VIDEO=on npm run test:e2e
 *
 * To use installed Chrome instead of Chromium (often fixes blank recordings):
 *   PLAYWRIGHT_CHROME=1 npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    video: process.env.VIDEO === "on" ? "on" : "on-first-retry",
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      args: [
        "--disable-dev-shm-usage",
        "--disable-background-timer-throttling",
        "--disable-background-media-suspend",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
      ...(process.env.PLAYWRIGHT_CHROME === "1" && {
        channel: "chrome",
      }),
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
