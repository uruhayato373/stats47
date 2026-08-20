export type { JapanAvailability } from "./types";
export { JAPAN_NATIONAL_AREA_CODE, PREFECTURE_AREA_CODE_RE } from "./types";
export { resolveJapanValue } from "./resolve-japan-value";
export type { AreaValueRow, JapanValueResult } from "./resolve-japan-value";
export { buildJapanSeriesRows } from "./build-japan-series";
export type {
  BuildJapanSeriesResult,
  EstatNationalRow,
  JapanSeriesRowResult,
} from "./build-japan-series";
export {
  JAPAN_CATALOGS,
  getJapanCatalogTheme,
  listJapanCatalogThemes,
} from "./japan-catalog";
export type { JapanCatalogMetric, JapanCatalogTheme } from "./japan-catalog";
export {
  WORLD_CATALOGS,
  WORLD_DATA_PROVIDER_CANDIDATES,
  WORLD_DATA_PROVIDER_EVALUATIONS,
  getWorldCatalogTheme,
  listWorldCatalogThemes,
} from "./world-types";
export type {
  WorldAvailability,
  WorldCatalogMetric,
  WorldCatalogTheme,
  WorldDataProvider,
  WorldDataProviderEvaluation,
} from "./world-types";
