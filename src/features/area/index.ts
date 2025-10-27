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
  areAllCodesValid,
  createAreaFilter,
  extractPrefectureCode,
  getAreaType,
  getDesignatedCityCode,
  getParentPrefectureCode,
  isDesignatedCityWard,
  normalizeAreaCode,
  normalizePrefectureCode,
  validateArea,
  validateAreaCode,
  validateAreaCodes,
  validateCityCode,
  validatePrefectureCode,
  validatePrefectureName,
} from "./utils/code-converter";

// ============================================================================
// リポジトリ
// ============================================================================
export * from "./repositories/area-repository";

// ============================================================================
// サービス
// ============================================================================
export * from "./services/municipality-service";
export * from "./services/prefecture-service";

// ============================================================================
// コンポーネント
// ============================================================================
export * from "./components";
