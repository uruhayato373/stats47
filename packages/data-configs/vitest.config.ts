import { defineConfig } from "vitest/config";

import criticalCoverage from "../../.claude/config/critical-module-coverage.json";

const criticalThresholds = Object.fromEntries(
  criticalCoverage.modules
    .filter(({ workspace }) => workspace === "packages/data-configs")
    .map(({ module, floor }) => [module, floor]),
);

/**
 * data-configs のテスト設定。
 *
 * 2026-07-29 に新設。それまで本パッケージは vitest workspace に未登録で、
 * 既存の `src/provenance/resolve-metric-provenance.test.ts` も**一度も実行されていなかった**。
 * include は `__tests__/` 配下と `src` 直下併置の両形式を拾う (既存テストが後者のため)。
 */
export default defineConfig({
  test: {
    name: "@stats47/data-configs",
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**",
      ...(process.env.STATS47_COVERAGE_SPLIT === '1'
        ? criticalCoverage.modules.filter((m) => m.workspace === 'packages/data-configs').flatMap((m) => m.tests)
        : []),
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/__tests__/**", "src/**/*.test.ts", "src/**/index.ts", "src/metrics/**"],
      thresholds: criticalThresholds,
    },
  },
});
