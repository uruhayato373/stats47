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
export { CacheError, DataSourceError, GeoshapeError } from "./types";

// 設定
export {
  buildGeoshapeExternalUrl,
  buildR2Key,
  geoshapeConfig,
  isMockEnvironment,
  resolutionFileMap,
} from "./config/geoshape-config";

// リポジトリ（純粋な関数）
export { ExternalDataSource } from "./repositories/external-data-source";
export {
  buildCacheStatus,
  checkDataSources,
  clearGeoshapeCache,
  fetchTopology,
} from "./repositories/geoshape-repository";
export { MockDataSource } from "./repositories/mock-data-source";
export { R2DataSource } from "./repositories/r2-data-source";

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
