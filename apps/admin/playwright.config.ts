import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);

/**
 * Playwright 設定 (apps/admin E2E 専用)。
 * gallery 専用ポート (47470) で、ローカルはdev server、CIは検証済みbuildをnext startする。
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  // Next dev の初回コンパイルを同時に叩きすぎると Windows で30秒を超えるため上限を固定する。
  workers: isCI ? 1 : 4,
  // .mjs は常に ESM なので変換せず Node にそのまま読ませる。変換すると import.meta や JSON の import 属性を使う
  // 部品 (note の記事台帳 article-ledger.mjs) が CommonJS 化されて読み込み時に落ちる (2026-10-13 PR #1125)。
  build: { external: ["**/*.mjs"] },

  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
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
    command: isCI ? "npm run start" : "npm run dev",
    env: {
      PORT: "47470",
      ...(isCI ? {} : { NEXT_DIST_DIR: ".local/next-e2e" }),
    },
    url: "http://127.0.0.1:47470",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
