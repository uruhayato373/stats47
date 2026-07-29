import { defineConfig } from "vitest/config";

/**
 * data-configs のテスト設定。
 *
 * 2026-07-29 に新設。それまでこのパッケージは `vitest.workspace.ts` に載っておらず、
 * `src/provenance/resolve-metric-provenance.test.ts` がルートからの一括実行で
 * 走らないままだった。走らないテストは無いのと同じなので workspace に載せる。
 *
 * `__tests__/` 配下と、既存の同階層 `*.test.ts` の両方を拾う。
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
