/**
 * Geoshapeドメイン - 設定管理
 * データソースとキャッシュの設定
 */

import { GeoshapeConfig } from "../types/index";

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
 * 解像度別のファイル名マッピング
 */
export const resolutionFileMap = {
  low: "jp_pref.l.topojson",
  medium: "jp_pref.m.topojson",
  high: "jp_pref.h.topojson",
} as const;

/**
 * Geoshape外部APIのデータURL構築
 * @param resolution 解像度レベル
 * @returns 完全なURL
 */
export function buildGeoshapeExternalUrl(
  resolution: "low" | "medium" | "high" = "low"
): string {
  // Geoshapeリポジトリの実際のURL構造に基づいて構築
  // 例: https://geoshape.ex.nii.ac.jp/geonlp/download/latest/jp_pref.l.topojson
  return `${geoshapeConfig.externalApiUrl}/geonlp/download/latest/${resolutionFileMap[resolution]}`;
}

/**
 * R2ストレージのキーを構築
 * @param resolution 解像度レベル
 * @returns R2オブジェクトキー
 */
export function buildR2Key(
  resolution: "low" | "medium" | "high" = "low"
): string {
  return `${geoshapeConfig.r2BucketPath}/prefecture.${resolution}.topojson`;
}
