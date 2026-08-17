/**
 * 国土数値情報（MLIT KSJ）データセット型定義
 */

import type { PrefectureSource } from "./prefecture-assign";

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

/**
 * pipeline 実行時に必要な「コードに残さざるを得ない」設定のみを保持する slim 型。
 * 純メタデータ (name, category, license 等) は D1 gis_datasets に寄せる。
 *
 * Phase 2 of GIS dataset management refactor (plan: stateless-stargazing-teapot).
 */
export interface KsjCodeConfig {
  dataId: string;
  /** ダウンロード URL テンプレート。{VERSION}/{PREF}/{MESHCODE} を含む */
  downloadUrlPattern: string;
  /** zip 内の GeoJSON 格納パス */
  geojsonDirInZip: string;
  /** KSJ 属性コード → 人間可読名 (例: { N02_001: "railwayType" }) */
  propertyMap: Record<string, string>;
  /** 簡略化パラメータ。省略時は geometryType から派生 */
  simplifyOptions?: KsjSimplifyOptions;
  /**
   * feature を都道府県へ帰属させるとき、どの属性を見るか。
   *
   * KSJ の多くは住所・県名・行政区域コードを持つので、一次資料の答えをそのまま使える。
   * 宣言が無いデータセットは県ポリゴンへの空間結合にフォールバックする。
   *
   * **全プロパティの走査はしない** — 実データに罠がある (P12 観光資源の `P12_001` は
   * 資源 ID だが 5 桁なので、市区町村コードとして読むと別の県に化ける)。
   *
   * 正典: `prefecture-assign.ts`
   */
  prefectureSource?: PrefectureSource;
}

/**
 * D1 から取得した純メタデータと registry の KsjCodeConfig をマージした実行時オブジェクト。
 * pipeline.ts 内部で組み立てる。
 */
export interface KsjResolvedDataset {
  dataId: string;
  name: string;
  nameEn: string;
  category: KsjCategory;
  geometryType: KsjGeometryType;
  coverage: KsjCoverage;
  license: string;
  latestVersion: string;
  downloadUrlPattern: string;
  geojsonDirInZip: string;
  propertyMap: Record<string, string>;
  simplifyOptions: KsjSimplifyOptions;
  attribution: string;
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
