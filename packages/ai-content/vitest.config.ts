import path from "node:path";

import { configDefaults, defineConfig } from "vitest/config";

/**
 * ai-content のテスト設定。
 *
 * ★2026-07-31 新設。それまで本パッケージは vitest.config.ts も workspace 登録も持たず、
 * `generation-outcome` (生成 0 件を必ず赤にする gate)・`blog-topic-gate` (壊れた metric で
 * 記事を書かせない gate)・`ranking-content-prompt` (プロンプトに全角括弧が戻ると落ちる
 * 再発防止) の 3 本が**一度も実行されていなかった**。
 * いずれも「無人生成が黙って壊れる」のを防ぐためのテストなので、走らないと意味がない。
 */
export default defineConfig({
  test: {
    name: "@stats47/ai-content",
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    exclude: [...configDefaults.exclude],
  },
  resolve: {
    alias: [
      // prompts は Server Component 専用モジュールを import するので、テストでは空にする
      // (前例: packages/estat-api/test-utils/server-only-mock.js)
      { find: "server-only", replacement: path.resolve(__dirname, "./test-utils/server-only-mock.js") },
    ],
  },
});
