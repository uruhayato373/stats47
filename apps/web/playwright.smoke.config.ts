import { defineConfig, devices } from "@playwright/test";

/**
 * 本番スモークテスト用 Playwright 設定
 *
 * 本番 URL に対して主要ページの表示を検証する。
 * ローカル dev サーバーは起動しない。
 *
 * @example
 * # 本番環境（デフォルト）
 * npx playwright test --config playwright.smoke.config.ts
 *
 * # URL指定
 * PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 npx playwright test --config playwright.smoke.config.ts
 */
export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: true,
  retries: 1,
  timeout: 30_000,

  reporter: [["list"], ["html", { outputFolder: "playwright-smoke-report" }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "https://stats47.jp",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "smoke-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // 本番テストなので webServer は起動しない
});
