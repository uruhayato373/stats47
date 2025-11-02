/**
 * Geoshapeドメイン - 設定管理
 *
 * 地理データ（TopoJSON）のデータソース設定とキャッシュ管理を行うモジュール。
 * 外部API、R2ストレージ、MockデータのURL生成、都道府県コードの検証・正規化を提供。
 *
 * @module geoshape-config
 */

import { GeoshapeConfig } from "../types/index";

import type { AreaType, CityVersion } from "../types/index";

/**
 * Mock環境かどうかを判定
 *
 * 環境変数 `NEXT_PUBLIC_USE_MOCK_DATA` が `"true"` に設定されている場合、
 * Mockデータを使用する開発環境であることを示す。
 *
 * @returns Mock環境の場合 `true`、それ以外は `false`
 */
export const isMockEnvironment = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
};

/**
 * Geoshape基本設定
 *
 * Mockデータパス、外部API URL、R2ストレージパス、キャッシュ有効期限を定義。
 */
export const geoshapeConfig: GeoshapeConfig = {
  mockDataPath: "/data/mock/gis/geoshape/jp_pref.l.topojson",
  externalApiUrl: "https://geoshape.ex.nii.ac.jp",
  r2BucketPath: "gis/geoshape",
  cacheMaxAge: 86400, // 24時間
};

/**
 * Geoshapeデータ自動キャッシング設定
 *
 * データ取得の優先順位とキャッシュ戦略を定義：
 * 1. 静的データ（ビルドに含める）
 * 2. R2ストレージ（CDN経由）
 * 3. 外部URL（フォールバック）
 */
export const GEOSHAPE_CONFIG = {
  static: {
    prefectures: "/data/geoshape/prefectures/jp_pref.topojson",
    metadata: "/data/geoshape/metadata/version.json",
  },
  r2: {
    baseUrl:
      process.env.NEXT_PUBLIC_R2_GEOSHAPE_URL || "https://geoshape.stats47.com",
    bucketName: "stats47-geoshape",
    municipalities: (prefCode: string) =>
      `municipalities/${prefCode}_city.topojson`,
    municipalitiesMerged: (prefCode: string) =>
      `municipalities-merged/${prefCode}_city_dc.topojson`,
  },
  fallback: {
    baseUrl: "https://geoshape.ex.nii.ac.jp/city/choropleth",
    municipalities: (prefCode: string) => `${prefCode}_city.topojson`,
    municipalitiesMerged: (prefCode: string) => `${prefCode}_city_dc.topojson`,
  },
  cache: {
    browserTTL: 60 * 60 * 24 * 30, // 30日
    cdnTTL: 60 * 60 * 24 * 365, // 1年
    swrTTL: Infinity, // 永続
    retryAttempts: 3,
    retryDelay: 1000, // ms
    timeout: 10000, // ms
  },
  version: "2024.03.31",
} as const;

/**
 * 都道府県コードが有効かどうかを検証
 *
 * 都道府県コードは1から47までの数値である必要がある。
 *
 * @param code - 検証する都道府県コード
 * @returns 有効な場合 `true`、それ以外は `false`
 *
 * @example
 * ```typescript
 * validatePrefectureCode("01"); // true
 * validatePrefectureCode("47"); // true
 * validatePrefectureCode("48"); // false
 * validatePrefectureCode("0"); // false
 * ```
 */
export function validatePrefectureCode(code: string): boolean {
  const numCode = parseInt(code);
  return numCode >= 1 && numCode <= 47;
}

/**
 * 都道府県コードを2桁ゼロパディング形式に正規化
 *
 * 数値や1桁の文字列を2桁のゼロパディングされた文字列に変換する。
 *
 * @param code - 正規化する都道府県コード（数値または文字列）
 * @returns 2桁ゼロパディングされた都道府県コード（例: "01", "47"）
 *
 * @example
 * ```typescript
 * normalizePrefectureCode(1); // "01"
 * normalizePrefectureCode("5"); // "05"
 * normalizePrefectureCode("47"); // "47"
 * ```
 */
export function normalizePrefectureCode(code: string | number): string {
  return code.toString().padStart(2, "0");
}

/**
 * キャッシュキーを生成
 *
 * レベルと都道府県コードから一意のキャッシュキーを生成する。
 *
 * @param level - データレベル（"city" または "municipality_merged"）
 * @param prefectureCode - 都道府県コード（2桁）
 * @returns キャッシュキー文字列（例: "city/01"）
 */
export function generateCacheKey(
  level: "city" | "municipality_merged",
  prefectureCode: string
): string {
  return `${level}/${prefectureCode}`;
}

/**
 * R2ストレージ用のファイル名を生成
 *
 * データレベルと都道府県コードからR2ストレージ内のファイルパスを生成する。
 *
 * @param level - データレベル（"city" または "municipality_merged"）
 * @param prefectureCode - 都道府県コード（2桁）
 * @returns R2ストレージ内のファイルパス
 *
 * @example
 * ```typescript
 * generateR2FileName("city", "01"); // "municipalities/01_city.topojson"
 * generateR2FileName("municipality_merged", "01"); // "municipalities-merged/01_city_dc.topojson"
 * ```
 */
export function generateR2FileName(
  level: "city" | "municipality_merged",
  prefectureCode: string
): string {
  return level === "city"
    ? `municipalities/${prefectureCode}_city.topojson`
    : `municipalities-merged/${prefectureCode}_city_dc.topojson`;
}

/**
 * 外部API用のファイル名を生成
 *
 * データレベルと都道府県コードから外部APIで使用するファイル名を生成する。
 *
 * @param level - データレベル（"city" または "municipality_merged"）
 * @param prefectureCode - 都道府県コード（2桁）
 * @returns 外部API用のファイル名
 *
 * @example
 * ```typescript
 * generateExternalFileName("city", "01"); // "01_city.topojson"
 * generateExternalFileName("municipality_merged", "01"); // "01_city_dc.topojson"
 * ```
 */
export function generateExternalFileName(
  level: "city" | "municipality_merged",
  prefectureCode: string
): string {
  return level === "city"
    ? `${prefectureCode}_city.topojson`
    : `${prefectureCode}_city_dc.topojson`;
}

/**
 * Geoshape外部APIのURLを構築
 *
 * 地域タイプ、都道府県コード、市区町村版タイプから外部APIの完全なURLを生成する。
 * `national` と `prefecture` は同じ都道府県データを使用する。
 *
 * @param areaType - 地域タイプ（"national", "prefecture", "municipality"）
 * @param prefCode - 都道府県コード（2桁）。`municipality` の場合は必須
 * @param version - 市区町村版タイプ（"merged": 政令指定都市統合版、"split": 分割版）
 * @returns 外部APIの完全なURL
 * @throws `municipality` タイプで `prefCode` が未指定の場合
 *
 * @example
 * ```typescript
 * buildGeoshapeExternalUrl("prefecture"); // "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson"
 * buildGeoshapeExternalUrl("municipality", "01", "merged"); // "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/01/01_city_dc.i.topojson"
 * ```
 */
export function buildGeoshapeExternalUrl(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: CityVersion = "merged"
): string {
  const baseUrl = `${geoshapeConfig.externalApiUrl}/city/topojson/20230101`;

  if (areaType === "national" || areaType === "prefecture") {
    return `${baseUrl}/jp_pref.l.topojson`;
  }

  if (!prefCode) {
    throw new Error("prefCode is required for municipality areaType");
  }

  const versionSuffix =
    version === "merged" ? "_city_dc.i.topojson" : "_city.i.topojson";
  return `${baseUrl}/${prefCode}/${prefCode}${versionSuffix}`;
}

/**
 * 全国市区町村TopoJSONデータのURLを構築
 *
 * 全ての市区町村を包含するTopoJSONファイルのURLを生成する。
 *
 * @returns 全国市区町村データの完全なURL
 *
 * @example
 * ```typescript
 * buildAllCitiesGeoshapeUrl(); // "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_city.c.topojson"
 * ```
 */
export function buildAllCitiesGeoshapeUrl(): string {
  const baseUrl = `${geoshapeConfig.externalApiUrl}/city/topojson/20230101`;
  return `${baseUrl}/jp_city.c.topojson`;
}

/**
 * R2ストレージ内のオブジェクトキーを構築
 *
 * 地域タイプ、都道府県コード、市区町村版タイプからR2ストレージ内のオブジェクトキーを生成する。
 *
 * @param areaType - 地域タイプ（"national", "prefecture", "municipality"）
 * @param prefCode - 都道府県コード（2桁）。`municipality` の場合は必須
 * @param version - 市区町村版タイプ（"merged": 政令指定都市統合版、"split": 分割版）
 * @returns R2ストレージ内のオブジェクトキー
 *
 * @example
 * ```typescript
 * buildR2Key("prefecture"); // "gis/geoshape/prefecture.topojson"
 * buildR2Key("municipality", "01", "merged"); // "gis/geoshape/municipality/01.merged.topojson"
 * ```
 */
export function buildR2Key(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: CityVersion = "merged"
): string {
  if (areaType === "national" || areaType === "prefecture") {
    return `${geoshapeConfig.r2BucketPath}/prefecture.topojson`;
  }

  const versionSuffix = version === "merged" ? "merged" : "split";
  return `${geoshapeConfig.r2BucketPath}/municipality/${prefCode}.${versionSuffix}.topojson`;
}

/**
 * Mockデータのパスを構築
 *
 * 開発環境で使用するMockデータファイルのパスを生成する。
 *
 * @param areaType - 地域タイプ（"national", "prefecture", "municipality"）
 * @param prefCode - 都道府県コード（2桁）。`municipality` の場合は必須
 * @param version - 市区町村版タイプ（"merged": 政令指定都市統合版、"split": 分割版）
 * @returns Mockデータのパス（publicディレクトリ配下）
 *
 * @example
 * ```typescript
 * buildMockDataPath("prefecture"); // "/data/mock/gis/geoshape/jp_pref.l.topojson"
 * buildMockDataPath("municipality", "01", "merged"); // "/data/mock/gis/geoshape/01/01_city_dc.i.topojson"
 * ```
 */
export function buildMockDataPath(
  areaType: AreaType = "prefecture",
  prefCode?: string,
  version: CityVersion = "merged"
): string {
  if (areaType === "national" || areaType === "prefecture") {
    return "/data/mock/gis/geoshape/jp_pref.l.topojson";
  }

  const versionSuffix = version === "merged" ? "_dc" : "";
  return `/data/mock/gis/geoshape/${prefCode}/${prefCode}_city${versionSuffix}.i.topojson`;
}
