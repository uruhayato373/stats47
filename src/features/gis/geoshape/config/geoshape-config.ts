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
 * 使用する解像度（低解像度のみ）
 */
const RESOLUTION_FILE = "jp_pref.l.topojson";

/**
 * Geoshape外部APIのデータURL構築
 * @returns 完全なURL
 */
export function buildGeoshapeExternalUrl(): string {
  // Geoshapeリポジトリの実際のURL構造に基づいて構築
  // 例: https://geoshape.ex.nii.ac.jp/geonlp/download/latest/jp_pref.l.topojson
  return `${geoshapeConfig.externalApiUrl}/geonlp/download/latest/${RESOLUTION_FILE}`;
}

/**
 * R2ストレージのキーを構築
 * @returns R2オブジェクトキー
 */
export function buildR2Key(): string {
  return `${geoshapeConfig.r2BucketPath}/prefecture.low.topojson`;
}
