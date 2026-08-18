import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 設定 (apps/admin E2E 専用)。
 * apps/web/playwright.config.ts を参考に、gallery 専用ポート (47470) で dev server を起動する。
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,

  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:47470",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
  ],

  webServer: {
    command: "npm run dev",
    env: { PORT: "47470" },
    url: "http://127.0.0.1:47470",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
