/**
 * Geoshapeドメイン - 型定義
 *
 * 地理データ（TopoJSON/GeoJSON）に関するすべての型定義を提供。
 * TopoJSON、GeoJSON、データソース設定、キャッシュ管理に関する型を含む。
 */

// 共通型定義（他のドメインからインポート）

/**
 * 地域タイプ
 *
 * Areaドメインからインポートされた地域タイプ定義。
 */
export type { AreaType } from "@/features/area/types/index";

/**
 * TopoJSONトポロジー型
 *
 * topojson-clientライブラリと互換性のあるTopoJSONトポロジーの型定義。
 */
export interface TopoJSONTopology {
  type: "Topology";
  objects: Record<string, TopoJSONGeometryCollection>;
  arcs: number[][][];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
  bbox?: [number, number, number, number];
  metadata?: Record<string, unknown>;
}

/**
 * TopoJSONジオメトリコレクション型
 *
 * TopoJSONトポロジー内のオブジェクト構造を表す。
 */
export interface TopoJSONGeometryCollection {
  type: "GeometryCollection";
  geometries: TopoJSONGeometry[];
}

/**
 * TopoJSONジオメトリ型
 *
 * TopoJSON内の個別のジオメトリを表す。
 */
export interface TopoJSONGeometry {
  type: string;
  arcs?: number[][] | number[][][];
  properties?: Record<string, unknown>;
  id?: string | number;
}

// GeoJSON型定義

/**
 * 都道府県用GeoJSON Feature型
 *
 * 都道府県データを表現するGeoJSON Feature。
 */
export interface PrefectureFeature extends GeoJSON.Feature {
  type: "Feature";
  properties: {
    prefCode: string;
    prefName: string;
    [key: string]: unknown;
  };
  geometry: GeoJSON.Geometry;
}

/**
 * 市区町村用GeoJSON Feature型
 *
 * 市区町村データを表現するGeoJSON Feature。
 */
export interface CityFeature extends GeoJSON.Feature {
  type: "Feature";
  properties: {
    cityCode: string;
    cityName: string;
    prefCode: string;
    prefName: string;
    [key: string]: unknown;
  };
  geometry: GeoJSON.Geometry;
}

/**
 * 市区町村版タイプ
 *
 * - `"merged"`: 政令指定都市統合版（_dc）
 * - `"split"`: 政令指定都市分割版
 */
export type CityVersion = "merged" | "split";

/**
 * Geoshape設定
 *
 * Mockデータパス、外部API URL、R2ストレージパス、キャッシュ有効期限を定義。
 */
export interface GeoshapeConfig {
  /** Mockデータのパス（publicディレクトリ配下） */
  mockDataPath: string;
  /** 外部API（Geoshapeリポジトリ）のベースURL */
  externalApiUrl: string;
  /** R2ストレージのバケットパス */
  r2BucketPath: string;
  /** キャッシュ有効期限（秒） */
  cacheMaxAge: number;
}

/**
 * データソースタイプ
 *
 * TopoJSONデータの取得元を表す。
 */
export type DataSourceType = "memory" | "r2" | "external";

/**
 * データ取得オプション
 *
 * TopoJSONデータ取得時のオプション設定。
 */
export interface FetchOptions {
  /** 地域レベル（"national"は都道府県と同じデータを使用） */
  areaType?: import("@/features/area/types/index").AreaType;
  /** 都道府県コード（2桁）。`municipality` の場合は必須 */
  prefCode?: string;
  /** 市区町村版タイプ */
  municipalityVersion?: CityVersion;
  /** キャッシュを使用するか（デフォルト: `true`） */
  useCache?: boolean;
  /** 強制再取得（キャッシュを無視） */
  forceRefresh?: boolean;
}

/**
 * データ取得結果
 *
 * TopoJSONデータの取得結果と取得元情報を含む。
 *
 * @template T - 取得されたデータの型（通常は `TopoJSONTopology`）
 */
export interface FetchResult<T> {
  /** 取得されたデータ */
  data: T;
  /** データソース（"memory" | "r2" | "external"） */
  source: DataSourceType;
  /** 取得時刻（Unixタイムスタンプ） */
  timestamp: number;
}

// GeoShapeデータ自動キャッシング型定義

/**
 * GeoShapeデータレベル
 *
 * 市区町村データの種類を表す。
 */
export type GeoShapeDataLevel = "city" | "municipality_merged";

/**
 * プリウォーム結果
 *
 * データの事前読み込み（プリウォーム）の結果を表す。
 */
export interface PrewarmResult {
  /** 成功した数 */
  success: number;
  /** 失敗した数 */
  failed: number;
  /** スキップされた数 */
  skipped: number;
  /** エラー詳細 */
  errors: Array<{
    /** 都道府県コード */
    prefectureCode: string;
    /** エラーメッセージ */
    error: string;
  }>;
}
