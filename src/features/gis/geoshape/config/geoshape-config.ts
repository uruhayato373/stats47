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
