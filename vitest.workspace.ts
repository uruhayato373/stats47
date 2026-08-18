import { defineWorkspace } from 'vitest/config';

/**
 * vitest workspace 設定
 *
 * 各パッケージ・アプリの vitest.config.ts をそのまま活かしつつ、
 * ルートから一括実行できるようにする。
 * 手動実行専用テスト（manual-download.test.ts 等）はここで除外する。
 */
export default defineWorkspace([
  // --- packages ---
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

  // --- apps ---
  'apps/admin/vitest.config.ts',
  'apps/web/vitest.config.ts',
]);
