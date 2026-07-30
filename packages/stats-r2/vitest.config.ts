import { defineConfig } from "vitest/config";

/**
 * stats-r2 のテスト設定。
 *
 * 2026-07-30 に新設。それまで本パッケージは vitest workspace に未登録で、
 * 既存の `src/__tests__/schemas.test.ts` が**一度も実行されていなかった**
 * (data-configs が 2026-07-29 に同じ状態だったのと同型の取りこぼし)。
 *
 * ここが動いていないと `parseStatsMeta` のホワイトリスト落ち
 * (meta を拡張したのに読み側を直し忘れる) を機械検知できない。
 */
export default defineConfig({
  test: {
    name: "@stats47/stats-r2",
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
