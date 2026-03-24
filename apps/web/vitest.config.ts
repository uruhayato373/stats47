import path from "path";

import react from "@vitejs/plugin-react";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/config/test.setup.tsx"],
    // Node.jsモジュールを正しく処理するための設定
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    // 並列実行を有効化（パフォーマンス向上）
    maxWorkers: 4,
    minWorkers: 2,
    // テストタイムアウトを設定（デフォルト: 5秒）
    testTimeout: 10000,
    
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.open-next/**",
      "**/coverage/**",
      "**/tests/e2e/**", // E2E tests are handled by Playwright
      "**/tests/visual/**", // Visual regression tests are handled by Playwright
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
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
      ],
      include: ["src/**/*.{ts,tsx}"],
      thresholds: {
        lines: 10,
        functions: 10,
        branches: 10,
        statements: 10,
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
