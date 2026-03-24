/**
 * Geoshape外部APIのURL構築ユーティリティ
 *
 * 地域タイプ、都道府県コード、政令指定都市の区表示モードから外部APIの完全なURLを生成する。
 * パスセグメント（version + ファイル名）は buildGeoshapePathSegment で一元管理し、外部 API と R2 の両方で同じキーを使う。
 */

import { extractPrefectureCode } from "@stats47/area";

import type { GeoshapeOptions } from "../types/geoshape-options";

/** 外部 API のベース URL（geoshape.ex.nii.ac.jp） */
const GEOSHAPE_EXTERNAL_API_URL = "https://geoshape.ex.nii.ac.jp";

/** 外部 API のデータバージョン（日付）。パスセグメントの先頭に付与する */
export const GEOSHAPE_VERSION = "20230101";

/** 都道府県 TopoJSON ファイル名（低解像度） */
const PREFECTURE_FILENAME = "jp_pref.l.topojson";

/** 全国市区町村 TopoJSON ファイル名（中解像度・統合版） */
const CITY_MERGED_FILENAME = "jp_city_dc.i.topojson";

/** 全国市区町村 TopoJSON ファイル名（中解像度・分割版） */
const CITY_SPLIT_FILENAME = "jp_city.i.topojson";

/** 都道府県別市区町村のファイル名サフィックス（統合版） */
const PREF_CITY_MERGED_SUFFIX = "_city_dc.i.topojson";

/** 都道府県別市区町村のファイル名サフィックス（分割版） */
const PREF_CITY_SPLIT_SUFFIX = "_city.i.topojson";

/**
 * パスセグメントを構築（version + ファイルパス）
 *
 * 外部 API のベース以降のパスと R2 の相対パスで共通利用する。
 * jp_pref.l / city_dc.i 等の同一キーで外部 API と R2 を管理するための単一の真実の源。
 *
 * @param options - データ取得オプション
 * @returns パスセグメント（例: "20230101/jp_pref.l.topojson", "20230101/47/47_city_dc.i.topojson"）
 */
export function buildGeoshapePathSegment({
  areaType,
  prefCode,
  wardMode = "merged",
}: GeoshapeOptions): string {
  if (areaType === "national" || areaType === "prefecture") {
    return `${GEOSHAPE_VERSION}/${PREFECTURE_FILENAME}`;
  }

  if (!prefCode) {
    const cityFileName =
      wardMode === "merged" ? CITY_MERGED_FILENAME : CITY_SPLIT_FILENAME;
    return `${GEOSHAPE_VERSION}/${cityFileName}`;
  }

  const prefCode2Digit = extractPrefectureCode(prefCode);
  if (!prefCode2Digit) {
    throw new Error(`Invalid prefCode for Geoshape URL: "${prefCode}"`);
  }
  const suffix =
    wardMode === "merged" ? PREF_CITY_MERGED_SUFFIX : PREF_CITY_SPLIT_SUFFIX;
  return `${GEOSHAPE_VERSION}/${prefCode2Digit}/${prefCode2Digit}${suffix}`;
}

/**
 * Geoshape外部APIのURLを構築
 *
 * 地域タイプ、都道府県コード、政令指定都市の区表示モードから外部APIの完全なURLを生成する。
 * `national` と `prefecture` は同じ都道府県データを使用する。
 * `city` タイプの場合、`prefCode` の有無によって返すURLが異なります：
 * - `prefCode` が未指定の場合: 全国市区町村データ（`jp_city.i.topojson` または `jp_city_dc.i.topojson`）
 * - `prefCode` が指定されている場合: 都道府県別市区町村データ（`${prefCode}/${prefCode}_city.i.topojson` または `${prefCode}/${prefCode}_city_dc.i.topojson`）
 *
 * @param options - データ取得オプション
 * @returns 外部APIの完全なURL
 *
 * @example
 * ```typescript
 * buildGeoshapeExternalUrl({ areaType: "prefecture" }); // "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson"
 * buildGeoshapeExternalUrl({ areaType: "city", prefCode: "47000", wardMode: "merged" }); // "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/47/47_city_dc.i.topojson"
 * ```
 */
export function buildGeoshapeExternalUrl(options: GeoshapeOptions): string {
  const pathSegment = buildGeoshapePathSegment(options);
  return `${GEOSHAPE_EXTERNAL_API_URL}/city/topojson/${pathSegment}`;
}
