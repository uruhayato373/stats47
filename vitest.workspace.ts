import { defineWorkspace } from "vitest/config";

/**
 * vitest workspace 設定
 *
 * 各パッケージ・アプリの vitest.config.ts をそのまま活かしつつ、
 * ルートから一括実行できるようにする。
 * 手動実行専用テスト（manual-download.test.ts 等）はここで除外する。
 */
export default defineWorkspace([
  // --- packages ---
  "packages/area/vitest.config.ts",
  "packages/correlation/vitest.config.ts",
  "packages/ranking/vitest.config.ts",
  "packages/category/vitest.config.ts",
  "packages/database/vitest.config.ts",
  "packages/estat-api/vitest.config.ts",
  "packages/gis/vitest.config.ts",
  "packages/utils/vitest.config.ts",
  "packages/visualization/vitest.config.ts",

  // --- apps ---
  "apps/web/vitest.config.ts",
]);
