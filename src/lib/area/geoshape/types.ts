/**
 * GeoShapeデータ自動キャッシング型定義
 */

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
