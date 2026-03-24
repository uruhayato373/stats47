/**
 * 国土数値情報（MLIT KSJ）データセット型定義
 */

export type KsjGeometryType = "point" | "line" | "polygon" | "mesh" | "mixed";
export type KsjCoverage = "national" | "prefecture" | "mesh" | "region";
export type KsjLicense =
  | "cc-by-4.0"
  | "cc-by-4.0-partial"
  | "commercial-ok"
  | "non-commercial";
export type KsjCategory =
  | "land"
  | "policy"
  | "facility"
  | "transport"
  | "statistics";

export interface KsjSimplifyOptions {
  /** topojson quantize パラメータ（例: 1e5） */
  quantize: number;
  /** topojson simplify の quantile パラメータ（0〜1。0.01 = 上位99%の頂点を保持） */
  simplifyQuantile: number;
}

export interface KsjDatasetDef {
  dataId: string;
  name: string;
  nameEn: string;
  category: KsjCategory;
  geometryType: KsjGeometryType;
  coverage: KsjCoverage;
  license: KsjLicense;
  latestVersion: string;
  /** ダウンロード URL テンプレート。{VERSION} をバージョン文字列で置換 */
  downloadUrlPattern: string;
  /** zip 内の GeoJSON 格納パス。"UTF-8/" 等 */
  geojsonDirInZip: string;
  propertyMap: Record<string, string>;
  simplifyOptions: KsjSimplifyOptions;
  estimatedSize: string;
  /** stats47 のカテゴリキーとの紐付け */
  stats47Category?: string;
}

export interface KsjPipelineOptions {
  dataId: string;
  version?: string;
  prefCode?: string;
  outputDir?: string;
  /** 既存の zip を再利用する */
  skipDownload?: boolean;
}

export interface KsjPipelineResult {
  dataId: string;
  version: string;
  outputFiles: Array<{
    path: string;
    sizeBytes: number;
    featureCount: number;
  }>;
  totalDurationMs: number;
}
