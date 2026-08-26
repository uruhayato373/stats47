import { readFileSync } from "fs";
import path from "path";

import react from "@vitejs/plugin-react";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

// カバレッジ閾値 (回帰防止 floor) の単一ソース。pr-quality-check.yml のコメント step も
// 同ファイルを読むため、ここと CI で値がドリフトしない。
const coverageThresholds = JSON.parse(
  readFileSync(path.resolve(__dirname, "./coverage-thresholds.json"), "utf8"),
) as { lines: number; statements: number; functions: number; branches: number };

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/config/test.setup.tsx"],
    // Node.jsモジュールを正しく処理するための設定
    pool: "threads",
    // 並列実行を有効化（パフォーマンス向上）
    maxWorkers: 4,
    minWorkers: 2,
    // Vitest 4 は worker 数が異なる project に固有の groupOrder を求める。
    sequence: { groupOrder: 1 },
    // テストタイムアウトを設定（デフォルト: 5秒）
    testTimeout: 10000,
    
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.open-next/**",
      "**/coverage/**",
      "**/tests/e2e/**", // E2E tests are handled by Playwright
      "**/tests/smoke/**", // Smoke tests are handled by Playwright
      "**/tests/visual/**", // Visual regression tests are handled by Playwright
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html", "lcov"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/*.config.*",
        "**/vitest.shims.ts",
        "**/test.setup.tsx",
        "**/__mocks__/**",
        "**/__tests__/**",
        "**/node_modules/**",
        "**/.next/**",
        "**/dist/**",
        "**/build/**",
        "**/coverage/**",
        "**/*.d.ts",
        "**/types/**",
        "**/scripts/**",
        "**/.local/**",
        "**/public/**",
        // App Router の結線コード (page/layout/route/OGP/sitemap) は SSG/ISR/R2 依存で
        // unit テスト非対象。ページ遷移・API・SEO は E2E (Playwright) 担当 (tests/README.md)。
        "src/app/**",
        "src/middleware.ts",
        "src/providers/**",
        "src/store/**",
      ],
      include: ["src/**/*.{ts,tsx}"],
      // 閾値は coverage-thresholds.json が単一ソース (回帰防止 floor)。未達で vitest が exit 1。
      thresholds: {
        lines: coverageThresholds.lines,
        statements: coverageThresholds.statements,
        functions: coverageThresholds.functions,
        branches: coverageThresholds.branches,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@data": path.resolve(__dirname, "./data"),
      // monorepo内部パッケージのエイリアス
      "@stats47/components": path.resolve(
        __dirname,
        "../../packages/components/src"
      ),
      "@stats47/database": path.resolve(
        __dirname,
        "../../packages/database/src"
      ),
      "@stats47/estat-api": path.resolve(
        __dirname,
        "../../packages/estat-api/src"
      ),
      "@stats47/r2-storage": path.resolve(
        __dirname,
        "../../packages/r2-storage/src"
      ),
      // server-only をモック（テスト環境では空のモジュールとして扱う）
      "server-only": path.resolve(__dirname, "./vitest.shims.ts"),
      // next/server をモック（テスト環境用）
      "next/server": path.resolve(__dirname, "./vitest.shims.ts"),
    },
  },
  optimizeDeps: {
    exclude: ["node:path", "node:fs", "node:os"],
  },
});
