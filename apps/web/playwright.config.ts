import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright設定ファイル（E2Eテスト専用・ローカル実行用）
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Next.js の開発サーバーは R2 snapshot を読む重いページを同時コンパイルすると
  // Web Streams の内部エラーで応答を中断するため、ローカル E2E は直列で実行する。
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  retries: 0,

  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "e2e-chromium",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // build 時は remote snapshot の大量取得を避け、起動後だけ親プロセスの R2 URL を使う。
    // これにより CI は本番データで導線を検証しつつ、同じ snapshot の二重取得を行わない。
    command:
      "npm run workers:clean && R2_PUBLIC_FETCH_URL= NEXT_PUBLIC_R2_PUBLIC_URL= npm run build && npx next start --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 900_000,
  },
});
