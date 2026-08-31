import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/ai-content/vitest.config.ts',
      'packages/area/vitest.config.ts',
      'packages/area-profile/vitest.config.ts',
      'packages/correlation/vitest.config.ts',
      'packages/data-configs/vitest.config.ts',
      'packages/ranking/vitest.config.ts',
      'packages/r2-storage/vitest.config.ts',
      'packages/category/vitest.config.ts',
      'packages/database/vitest.config.ts',
      'packages/estat-api/vitest.config.ts',
      'packages/gis/vitest.config.ts',
      'packages/product-factory/vitest.config.ts',
      'packages/stats-r2/vitest.config.ts',
      'packages/types/vitest.config.ts',
      'packages/svg-builder/vitest.config.ts',
      'packages/utils/vitest.config.ts',
      'packages/visualization/vitest.config.ts',
      'apps/admin/vitest.config.ts',
      'apps/remotion/vitest.config.mts',
      'apps/web/vitest.config.ts',
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
