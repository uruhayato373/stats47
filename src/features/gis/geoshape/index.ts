/**
 * Geoshapeドメイン - エクスポート
 * 地理データ（TopoJSON/GeoJSON）の管理
 */

// 型定義
export type {
  DataSourceType,
  FetchOptions,
  FetchResult,
  GeoshapeConfig,
  PrefectureFeature,
  PrefectureFeatureCollection,
  ResolutionLevel,
  TopoJSONGeometry,
  TopoJSONGeometryCollection,
  TopoJSONTopology,
} from "./types";

// エラークラス
export { GeoShapeError } from "./types";

// 設定
export {
  buildGeoshapeExternalUrl,
  buildR2Key,
  geoshapeConfig,
  isMockEnvironment,
} from "./config/geoshape-config";

// リポジトリ（純粋な関数）
export {
  fetchFromExternalAPI,
  isExternalAPIAvailable,
} from "./repositories/external-data-source";
export {
  buildCacheStatus,
  checkDataSources,
  clearGeoshapeCache,
  fetchTopology,
} from "./repositories/geoshape-repository";
export {
  fetchFromMockData,
  isMockDataAvailable,
} from "./repositories/mock-data-source";
export {
  deleteFromR2,
  fetchFromR2,
  isR2Available,
  saveToR2,
} from "./repositories/r2-data-source";

// サービス（純粋な関数）
export {
  checkDataSources as checkGeoshapeDataSources,
  fetchMunicipalityTopology,
  fetchPrefectureTopology,
  fetchTopologyByAreaCode,
  getCacheStatus,
} from "./services/geoshape-service";

// ユーティリティ
export { validateTopojson } from "./utils/topojson-converter";
