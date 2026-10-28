export type { JapanAvailability, StatisticsScope } from './types';
export {
  JAPAN_NATIONAL_AREA_CODE,
  JAPAN_DERIVED_ADDITIVE_RECIPE_KEY,
  PREFECTURE_AREA_CODE_RE,
  isMunicipalityStatisticsScope,
} from './types';
export { resolveJapanValue } from './resolve-japan-value';
export type { AreaValueRow, JapanValueResult } from './resolve-japan-value';
export {
  buildDerivedAdditiveJapanSeriesRows,
  buildJapanSeriesRows,
} from './build-japan-series';
export type {
  BuildJapanSeriesResult,
  EstatNationalRow,
  JapanSeriesRowResult,
  PrefectureSeriesSourceRow,
} from './build-japan-series';
export {
  JAPAN_DERIVED_METRIC_DECISIONS,
  getJapanDerivedMetricDecision,
} from './japan-derived-metrics';
export type {
  AdoptedJapanDerivedMetricDecision,
  JapanDerivedMetricDecision,
  RejectedJapanDerivedMetricDecision,
} from './japan-derived-metrics';
export {
  JAPAN_CATALOGS,
  getJapanCatalogTheme,
  listJapanCatalogThemes,
} from './japan-catalog';
export type { JapanCatalogMetric, JapanCatalogTheme } from './japan-catalog';
export {
  WORLD_CATALOGS,
  WORLD_DATA_PROVIDER_CANDIDATES,
  WORLD_DATA_PROVIDER_EVALUATIONS,
  getWorldCatalogTheme,
  listWorldCatalogThemes,
} from './world-types';
export {
  KNOWN_MUNICIPALITY_RANKING_KEYS,
  KNOWN_MUNICIPALITY_THEME_SLUGS,
  MUNICIPALITY_METRIC_AVAILABILITY,
  MUNICIPALITY_THEME_CATALOGS,
  buildKnownMunicipalityRankingKeys,
  buildKnownMunicipalityThemeSlugs,
  getMunicipalityMetricAvailability,
  listMunicipalityMetricAvailability,
  validateMunicipalityCatalogs,
} from './municipality-catalog';
export type {
  MunicipalityMetricAvailability,
  MunicipalityThemeCatalog,
} from './municipality-catalog';
export { buildMunicipalityRankingSubtitles } from './municipality-ranking-titles';
export {
  MIN_MUNICIPALITIES_PER_PREFECTURE_RANKING,
  MUNICIPALITY_PREFECTURE_RANKING_KEYS,
  isMunicipalityPrefectureRankingKey,
} from './municipality-prefecture-ranking';
export {
  CITY_DATABOOK_LAYOUT,
  CITY_DATABOOK_POPULATION_METRIC_KEY,
  listCityDatabookThemes,
  validateCityDatabookLayout,
} from './city-databook-layout';
export type { CityDatabookLayout, CityDatabookTheme } from './city-databook-layout';
export {
  MUNICIPALITY_THEME_FOR_PREFECTURE_THEME,
  PREFECTURE_THEME_FOR_MUNICIPALITY_THEME,
  scopeHrefsForJapanTheme,
  scopeHrefsForMunicipalityRanking,
  scopeHrefsForMunicipalityTheme,
  scopeHrefsForPrefectureTheme,
} from './scope-theme-links';
export type { StatisticsScopeHrefs } from './scope-theme-links';
export { toGeoScopeStorageEntityKind } from './storage-adapter';
export type { GeoScopeStorageEntityKind } from './storage-adapter';
export type {
  WorldAvailability,
  WorldCatalogMetric,
  WorldCatalogTheme,
  WorldDataProvider,
  WorldDataProviderEvaluation,
} from './world-types';
export {
  VERIFY_TARGET_CLASSIFICATIONS,
  classifyEstatRequest,
  indexNationalEvidence,
} from './japan-candidate-classify';
export type { JapanCandidateClassification, LiveAuditEntry } from './japan-candidate-classify';
