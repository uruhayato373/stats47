/**
 * Geoshapeドメイン - 設定管理
 * データソースとキャッシュの設定
 */

import { GeoshapeConfig } from "../types/index";

import type { AreaType, MunicipalityVersion } from "../types/index";

/**
 * 環境判定
 */
export const isMockEnvironment = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
};

/**
 * Geoshape設定
 */
export const geoshapeConfig: GeoshapeConfig = {
  // Mockデータパス（publicディレクトリ配下）
  mockDataPath: "/data/mock/gis/geoshape/jp_pref.l.topojson",

  // 外部API（Geoshapeリポジトリ）
  externalApiUrl: "https://geoshape.ex.nii.ac.jp",

  // R2ストレージパス
  r2BucketPath: "geoshape/cache/2023",

  // キャッシュ有効期限（24時間）
  cacheMaxAge: 86400,
};

/**
 * GeoShapeデータ自動キャッシング設定
 *
 * R2ストレージ、外部URL、キャッシュTTL等の設定を管理
 */
export const GEOSHAPE_CONFIG = {
  // レベル1: 静的データ（ビルドに含める）
  static: {
    prefectures: "/data/geoshape/prefectures/jp_pref.topojson",
    metadata: "/data/geoshape/metadata/version.json",
  },

  // レベル2: R2ストレージ（CDN経由）
  r2: {
    baseUrl:
      process.env.NEXT_PUBLIC_R2_GEOSHAPE_URL || "https://geoshape.stats47.com",
    bucketName: "stats47-geoshape",
    municipalities: (prefCode: string) =>
      `municipalities/${prefCode}_city.topojson`,
    municipalitiesMerged: (prefCode: string) =>
      `municipalities-merged/${prefCode}_city_dc.topojson`,
  },

  // レベル3: 外部URL（フォールバック）
  fallback: {
    baseUrl: "https://geoshape.ex.nii.ac.jp/city/choropleth",
    municipalities: (prefCode: string) => `${prefCode}_city.topojson`,
    municipalitiesMerged: (prefCode: string) => `${prefCode}_city_dc.topojson`,
  },

  // キャッシュ設定
  cache: {
    browserTTL: 60 * 60 * 24 * 30, // 30日
    cdnTTL: 60 * 60 * 24 * 365, // 1年
    swrTTL: Infinity, // 永続
    retryAttempts: 3, // リトライ回数
    retryDelay: 1000, // リトライ遅延（ms）
    timeout: 10000, // タイムアウト（ms）
  },

  // データバージョン
  version: "2024.03.31",
} as const;

/**
 * 都道府県コードの検証
 */
export function validatePrefectureCode(code: string): boolean {
  const numCode = parseInt(code);
  return numCode >= 1 && numCode <= 47;
}

/**
 * 都道府県コードを正規化（2桁ゼロパディング）
 */
export function normalizePrefectureCode(code: string | number): string {
  return code.toString().padStart(2, "0");
}

/**
 * キャッシュキー生成
 */
export function generateCacheKey(
  level: "municipality" | "municipality_merged",
  prefectureCode: string
): string {
  return `${level}/${prefectureCode}`;
}

/**
 * R2ファイル名生成
 */
export function generateR2FileName(
  level: "municipality" | "municipality_merged",
  prefectureCode: string
): string {
  return level === "municipality"
    ? `municipalities/${prefectureCode}_city.topojson`
    : `municipalities-merged/${prefectureCode}_city_dc.topojson`;
}

/**
 * 外部URLファイル名生成
 */
export function generateExternalFileName(
  level: "municipality" | "municipality_merged",
  prefectureCode: string
): string {
  return level === "municipality"
    ? `${prefectureCode}_city.topojson`
    : `${prefectureCode}_city_dc.topojson`;
}

/**
 * Geoshape API URL構築
 * @param areaType 地域タイプ（"country"と"prefecture"は同じデータ）
 * @param prefCode 都道府県コード（2桁）- municipalityで必須
 * @param version 市区町村版タイプ
 * @returns 完全なURL
 */
export function buildGeoshapeExternalUrl(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: MunicipalityVersion = "merged"
): string {
  const baseUrl = `${geoshapeConfig.externalApiUrl}/city/topojson/20230101`;

  // countryとprefectureは同じ都道府県データを使用
  if (areaType === "country" || areaType === "prefecture") {
    return `${baseUrl}/jp_pref.l.topojson`;
  }

  // municipality
  if (!prefCode) {
    throw new Error("prefCode is required for municipality areaType");
  }

  // merged: _city_dc.i.topojson (政令指定都市統合版)
  // split:  _city.i.topojson    (政令指定都市分割版)
  const versionSuffix =
    version === "merged" ? "_city_dc.i.topojson" : "_city.i.topojson";
  return `${baseUrl}/${prefCode}/${prefCode}${versionSuffix}`;
}

/**
 * R2ストレージのキーを構築
 * @param areaType 地域タイプ
 * @param prefCode 都道府県コード（2桁）
 * @param version 市区町村版タイプ
 * @returns R2オブジェクトキー
 */
export function buildR2Key(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: MunicipalityVersion = "merged"
): string {
  if (areaType === "country" || areaType === "prefecture") {
    return `${geoshapeConfig.r2BucketPath}/prefecture.topojson`;
  }

  const versionSuffix = version === "merged" ? "merged" : "split";
  return `${geoshapeConfig.r2BucketPath}/municipality/${prefCode}.${versionSuffix}.topojson`;
}

/**
 * Mockデータパスを構築
 * @param areaType 地域タイプ
 * @param prefCode 都道府県コード（2桁）
 * @param version 市区町村版タイプ
 * @returns Mockデータのパス
 */
export function buildMockDataPath(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: MunicipalityVersion = "merged"
): string {
  if (areaType === "country" || areaType === "prefecture") {
    return "/data/mock/gis/geoshape/jp_pref.l.topojson";
  }

  // merged: _city_dc (政令指定都市統合版)
  // split:  _city    (政令指定都市分割版)
  const versionSuffix = version === "merged" ? "_dc" : "";
  return `/data/mock/gis/geoshape/${prefCode}/${prefCode}_city${versionSuffix}.i.topojson`;
}
