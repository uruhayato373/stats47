/**
 * Area Domain 統一エクスポート
 * 都道府県管理機能のみを提供
 */

// ============================================================================
// 型定義
// ============================================================================
export type {
  AreaType,
  MockPrefecture,
  MockPrefecturesData,
  MunicipalityType,
  Prefecture,
  Region,
  RegionMap,
} from "./types";

export { AreaError, DataSourceError } from "./types";

// ============================================================================
// ユーティリティ
// ============================================================================
export {
  areaCodeToPrefectureCode,
  detectMunicipalityType,
  isValidPrefectureCode,
  normalizeAreaCode,
  prefectureCodeToAreaCode,
} from "./utils/code-validator";

// ============================================================================
// リポジトリ
// ============================================================================
export { AreaRepository } from "./repositories/area-repository";

// ============================================================================
// サービス
// ============================================================================
export { PrefectureService } from "./services/prefecture-service";
