/**
 * Geoshapeドメイン - 型定義
 * 地理データ（TopoJSON/GeoJSON）の型定義
 */

// ============================================================================
// 共通型定義（他のドメインからインポート）
// ============================================================================

/**
 * 地域タイプ（Areaドメインからインポート）
 */
export type { AreaType } from "@/features/area/types/index";

// TopoJSON型定義（topojson-clientライブラリと互換性のある型）
export interface TopoJSONTopology {
  type: "Topology";
  objects: Record<string, TopoJSONGeometryCollection>;
  arcs: number[][][];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
  bbox?: [number, number, number, number];
  metadata?: Record<string, any>;
}

export interface TopoJSONGeometryCollection {
  type: "GeometryCollection";
  geometries: TopoJSONGeometry[];
}

export interface TopoJSONGeometry {
  type: string;
  arcs?: number[][] | number[][][];
  properties?: Record<string, any>;
  id?: string | number;
}

// GeoJSON Feature型（都道府県用）
export interface PrefectureFeature extends GeoJSON.Feature {
  type: "Feature";
  properties: {
    prefCode: string;
    prefName: string;
    [key: string]: any;
  };
  geometry: GeoJSON.Geometry;
}

// GeoJSON FeatureCollection型（都道府県用）
export interface PrefectureFeatureCollection extends GeoJSON.FeatureCollection {
  type: "FeatureCollection";
  features: PrefectureFeature[];
}

// ============================================================================
// 市区町村用の型定義
// ============================================================================

/**
 * 市区町村Feature型
 */
export interface MunicipalityFeature extends GeoJSON.Feature {
  type: "Feature";
  properties: {
    cityCode: string;
    cityName: string;
    prefCode: string;
    prefName: string;
    [key: string]: any;
  };
  geometry: GeoJSON.Geometry;
}

/**
 * 市区町村FeatureCollection型
 */
export interface MunicipalityFeatureCollection
  extends GeoJSON.FeatureCollection {
  type: "FeatureCollection";
  features: MunicipalityFeature[];
}

/**
 * 市区町村版タイプ
 */
export type MunicipalityVersion = "merged" | "split"; // merged=統合版(dc), split=分割版

// データソース設定
export interface GeoshapeConfig {
  /** Mockデータのパス */
  mockDataPath: string;
  /** 外部API（Geoshape）のベースURL */
  externalApiUrl: string;
  /** R2ストレージのバケットパス */
  r2BucketPath: string;
  /** キャッシュ有効期限（秒） */
  cacheMaxAge: number;
}

// データ解像度レベル
export type ResolutionLevel = "low" | "medium" | "high";

// データソースタイプ
export type DataSourceType = "memory" | "mock" | "r2" | "external";

// データ取得オプション
export interface FetchOptions {
  /** 地域レベル（"country"は都道府県と同じデータを使用） */
  areaType?: import("@/features/area/types/index").AreaType;
  /** 都道府県コード（2桁）- municipalityで必須 */
  prefCode?: string;
  /** 市区町村版タイプ */
  municipalityVersion?: MunicipalityVersion;
  /** キャッシュを使用するか */
  useCache?: boolean;
  /** 強制再取得 */
  forceRefresh?: boolean;
}

// データ取得結果
export interface FetchResult<T> {
  /** データ */
  data: T;
  /** データソース */
  source: DataSourceType;
  /** 取得時刻（タイムスタンプ） */
  timestamp: number;
}

// ============================================================================
// GeoShapeデータ自動キャッシング型定義
// ============================================================================

export type GeoShapeDataLevel = "municipality" | "municipality_merged";

/**
 * プリウォーム結果
 */
export interface PrewarmResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{
    prefectureCode: string;
    error: string;
  }>;
}

/**
 * ロード結果
 */
export interface LoadResult {
  data: GeoJSON.FeatureCollection;
  source: "r2" | "external";
  cached: boolean;
  loadTime: number;
}

/**
 * R2保存リクエスト
 */
export interface R2SaveRequest {
  key: string;
  data: GeoJSON.FeatureCollection;
  metadata: {
    cachedAt: string;
    source: "external" | "manual";
    version: string;
  };
}

/**
 * R2保存レスポンス
 */
export interface R2SaveResponse {
  success: boolean;
  key: string;
  size: number;
  metadata: any;
  timestamp: string;
}

/**
 * プリウォームリクエスト
 */
export interface PrewarmRequest {
  level?: GeoShapeDataLevel;
}

/**
 * プリウォームレスポンス
 */
export interface PrewarmResponse {
  success: boolean;
  message: string;
  level: GeoShapeDataLevel;
  results: PrewarmResult;
  summary: string;
  duration: string;
  timestamp: string;
}

/**
 * キャッシュ統計
 */
export interface CacheStats {
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  r2Usage: {
    size: number;
    files: number;
  };
  lastUpdated: string;
}

/**
 * エラー情報
 */
export interface GeoShapeError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * ローディング状態
 */
export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  current?: string;
  total?: number;
}

/**
 * プリウォーム進行状況
 */
export interface PrewarmProgress {
  current: number;
  total: number;
  currentPrefecture: string;
  status: "idle" | "running" | "completed" | "error";
  results?: PrewarmResult;
}
