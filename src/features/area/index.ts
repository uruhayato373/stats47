/**
 * Area Domain 統一エクスポート
 * 都道府県管理機能のみを提供
 */

// ============================================================================
// 型定義
// ============================================================================
export type { AreaType, City, Prefecture, Region } from "./types";

export { AreaError, DataSourceError } from "./types";

// ============================================================================
// ユーティリティ
// ============================================================================
export {
  // 判定系
  determineAreaType,
  // 導出・変換系
  deriveParentPrefectureCode,
  deriveDesignatedCityCode,
  normalizeAreaCode,
  normalizePrefectureCode,
  // 抽出・作成系
  extractPrefectureCode,
  createAreaFilter,
  // 検証系
  areAllCodesValid,
  isDesignatedCityWard,
  validateArea,
  validateAreaCode,
  validateAreaCodes,
  validateCityCode,
  validatePrefectureCode,
  validatePrefectureName,
} from "./utils";

// ============================================================================
// リポジトリ
// ============================================================================
export { fetchCities, fetchPrefectures } from "./repositories";

// ============================================================================
// サービス
// ============================================================================
export * from "./services";

// ============================================================================
// コンポーネント
// ============================================================================
export * from "./components";

// ============================================================================
// 注意点（Server Actions）
// ============================================================================
// Server Action は manifest 解決の安定性の観点から、
// 中間のバレル（index.ts）越しの再エクスポートを避け、
// 呼び出し側は `@/features/area/actions` を直接 import してください。
// 例: `import { listPrefecturesAction } from "@/features/area/actions";`
