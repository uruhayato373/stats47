/**
 * Area Domain 統一エクスポート
 * すべてのAreaドメインの機能を一箇所からエクスポート
 */

// ============================================================================
// 型定義
// ============================================================================
export type {
  AreaCode,
  AreaHierarchy,
  AreaLevel,
  AreaSearchOptions,
  AreaSearchResult,
  AreaType,
  HierarchyPath,
  MockMunicipality,
  MockPrefecture,
  MockPrefecturesData,
  Municipality,
  MunicipalitySearchOptions,
  MunicipalityType,
  Prefecture,
  PrefectureSearchOptions,
  Region,
  RegionMap,
  ValidationResult,
} from "./types";

export {
  AreaCode,
  AreaCodeNotFoundError,
  AreaError,
  AreaLevelVO,
  DataSourceError,
  InvalidAreaCodeError,
} from "./types";

// ============================================================================
// ユーティリティ
// ============================================================================
export {
  areaCodeToPrefectureCode,
  detectMunicipalityType,
  getAreaLevel,
  getRegionKeyFromPrefectureCode,
  isMunicipalityCode,
  isPrefectureCode,
  isValidAreaCode,
  isValidHierarchyPath,
  isValidMunicipalityType,
  isValidParentChildRelation,
  isValidPrefectureCode,
  isValidRegionKey,
  normalizeAreaCode,
  prefectureCodeToAreaCode,
  validateAreaCode,
  validateAreaCodes,
} from "./utils/code-validator";

// ============================================================================
// リポジトリ
// ============================================================================
export { AreaRepository } from "./repositories/area-repository";

// ============================================================================
// サービス
// ============================================================================
export { AreaService } from "./services/area-service";
export { MunicipalityService } from "./services/municipality-service";
export { PrefectureService } from "./services/prefecture-service";
// ============================================================================
// React Hooks
// ============================================================================
export {
  usePrefecture,
  usePrefectureSearch,
  usePrefectureStatistics,
  usePrefectures,
  usePrefecturesByRegion,
  useRegions,
} from "./hooks/usePrefectures";

export {
  useMunicipalities,
  useMunicipalitiesByLevel,
  useMunicipalitiesByPrefecture,
  useMunicipalitiesByType,
  useMunicipality,
  useMunicipalitySearch,
  useMunicipalityStatistics,
  usePrefectureMunicipalityStatistics,
  useWardsByCity,
} from "./hooks/useMunicipalities";

export {
  useAreaChildren,
  useAreaHierarchy,
  useAreaParent,
  useAreaSearch,
  useAreaStatistics,
  useAreasByLevel,
  useAreasByType,
  useHierarchyPath,
} from "./hooks/useAreaHierarchy";
