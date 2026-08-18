import path from "node:path";

import { defineConfig } from "vitest/config";

/**
 * apps/admin の unit + route integration テスト設定。
 * - node 環境 (Route Handler / server module は Web 標準 API のみ使う)。
 * - server-only / next/server は vitest.shims.ts で代替 (dev server 不要でテスト)。
 * - `@` は gallery ルート (tsconfig の `@/*` → `./*` と一致)。
 * - 実 SSOT に触れないよう、テスト側は必ず fixture root を STATS47_PROJECT_ROOT で差し込む。
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**", "tests/e2e/**"],
    // project-root / posts-store はモジュール変数にキャッシュするため、テストは
    // vi.resetModules() で都度読み直す。ファイル間の汚染を避けるべく isolate を明示 (既定 true)。
    isolate: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "server-only": path.resolve(__dirname, "./vitest.shims.ts"),
      "next/server": path.resolve(__dirname, "./vitest.shims.ts"),
    },
  },
});
