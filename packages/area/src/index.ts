/**
 * @stats47/area
 *
 * 都道府県・市区町村の型定義、ユーティリティ、静的データを提供。
 */

// 型定義
export type {
  Area,
  AreaType,
  City,
  ExcludedMunicipalityEntity,
  MunicipalityEntity,
  MunicipalityEntityPolicy,
  MunicipalityExcludedKind,
  MunicipalityKind,
  Prefecture,
  PublishableMunicipalityEntity,
  Region,
  UnknownMunicipalityEntity,
} from './types';

// 定数
export {
  NATIONAL_AREA,
  PREFECTURE_SHORT_TO_REGION_MAP,
  PREFECTURE_TO_REGION_MAP,
  REGIONS,
} from './constants';

// ユーティリティ
export {
  extractPrefectureCode,
  lookupArea,
  to2DigitPrefCode,
  to5DigitPrefCode,
  PREFECTURE_LIST_2DIGIT,
} from './utils';

// リポジトリ（防御的コピーを返す）
export { fetchCities } from './repositories/fetch-cities';
export { fetchPrefectures } from './repositories/fetch-prefectures';

// 市区町村比較の公開エンティティ方針
export {
  STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
  buildMunicipalityEntityPolicy,
  listPublishableMunicipalities,
} from './municipalities';
