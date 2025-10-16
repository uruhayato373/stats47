/**
 * 地域（Area）ドメイン エクスポート
 */

// サービス
export { AreaService } from "./services/area-service";
export { PrefectureService } from "./services/prefecture-service";
export { MunicipalityService } from "./services/municipality-service";

// ユーティリティ
export {
  getAreaType,
  getParentPrefectureCode,
  normalizePrefectureCode,
  extractPrefectureCode,
  validateAreaCode,
  normalizeAreaCode,
  getDesignatedCityCode,
  isDesignatedCityWard,
  createAreaFilter,
} from "./utils/code-converter";

// バリデーター
export {
  validateArea,
  validatePrefectureCode,
  validateMunicipalityCode,
  validatePrefectureName,
  validateAreaCodes,
  areAllCodesValid,
} from "./validators/code-validator";

// 型定義
export type {
  AreaType,
  AreaLevel,
  MunicipalityType,
  Prefecture,
  Municipality,
  Region,
  AreaHierarchy,
  AreaValidationResult,
  AreaSearchOptions,
  AreaSearchResult,
  PrefectureSearchOptions,
  MunicipalitySearchOptions,
} from "./types";
