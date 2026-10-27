import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    maxWorkers: process.env.CI ? undefined : 2,
    projects: [
      'packages/ai-content/vitest.config.mts',
      'packages/area/vitest.config.mts',
      'packages/area-profile/vitest.config.mts',
      'packages/correlation/vitest.config.mts',
      'packages/data-configs/vitest.config.mts',
      'packages/ranking/vitest.config.mts',
      'packages/r2-storage/vitest.config.mts',
      'packages/category/vitest.config.mts',
      'packages/database/vitest.config.mts',
      'packages/estat-api/vitest.config.mts',
      'packages/gis/vitest.config.mts',
      'packages/product-factory/vitest.config.mts',
      'packages/stats-r2/vitest.config.mts',
      'packages/types/vitest.config.mts',
      'packages/svg-builder/vitest.config.mts',
      'packages/utils/vitest.config.mts',
      'packages/visualization/vitest.config.mts',
      'packages/migration-flow/vitest.config.mts',
      'apps/admin/vitest.config.mts',
      'apps/remotion/vitest.config.mts',
      'apps/web/vitest.config.mts',
    ],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.open-next/**',
      '**/coverage/**',
      // 手動実行専用テストを除外（NEXT_PUBLIC_ESTAT_APP_ID が必要）
      '**/*manual-download*',
    ],
  },
});
