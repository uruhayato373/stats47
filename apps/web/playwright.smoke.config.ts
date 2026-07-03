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
      // responsive-layout は下の viewport 別 projects で実行する
      testIgnore: /responsive-layout/,
    },
    // breakpoint 別レイアウト検証 (2026-07-03 運営総点検で追加)。
    // PageShell の契約: lg=1024px で右レール表示。375/768 は 1 カラム。
    // 対象 spec は tests/smoke/responsive-layout.spec.ts のみ (smoke 全体は 4x しない)。
    {
      name: "responsive-mobile-375",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } },
      testMatch: /responsive-layout/,
    },
    {
      name: "responsive-tablet-768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
      testMatch: /responsive-layout/,
    },
    {
      name: "responsive-lg-1024",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 800 } },
      testMatch: /responsive-layout/,
    },
    {
      name: "responsive-xl-1280",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
      testMatch: /responsive-layout/,
    },
  ],

  // 本番テストなので webServer は起動しない
});
