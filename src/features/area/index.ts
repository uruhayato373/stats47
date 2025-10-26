/**
 * Area Domain 統一エクスポート
 * 都道府県管理機能のみを提供
 */

// ============================================================================
// 型定義
// ============================================================================
export type {
  AreaType,
  MockMunicipalitiesData,
  MockMunicipality,
  MockPrefecture,
  MockPrefecturesData,
  Municipality,
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
export * from "./services/municipality-service";
export * from "./services/prefecture-service";

// ============================================================================
// コンポーネント
// ============================================================================
export * from "./components";
