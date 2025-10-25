/**
 * Geoshapeドメイン - 型定義
 * 地理データ（TopoJSON/GeoJSON）の型定義
 */

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
export type DataSourceType = "mock" | "r2" | "external";

// データ取得オプション
export interface FetchOptions {
  /** 解像度レベル */
  resolution?: ResolutionLevel;
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
  /** キャッシュヒットしたか */
  cached: boolean;
  /** 取得時刻 */
  fetchedAt: Date;
}

