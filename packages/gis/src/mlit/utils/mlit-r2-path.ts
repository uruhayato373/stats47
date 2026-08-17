/**
 * MLIT R2 相対パス構築ユーティリティ
 *
 * 国土数値情報 (MLIT) の TopoJSON を R2 から取得するためのパスを組み立てる。
 * geoshape とは別のプレフィックスを使用し、既存資産と分離する。
 */

import type { DesignatedCityWardMode } from "../../geoshape/types/geoshape-options";
import { assertPrefectureCode } from "../../utils/prefecture-code";

/** MLIT データバージョン（日付） */
export const MLIT_VERSION = "20240101";

/** R2 上の MLIT データのプレフィックス */
const R2_MLIT_PREFIX = "gis/mlit/";

export interface MlitR2PathOptions {
  /** "prefecture" | "city" | "allCities" */
  type: "prefecture" | "city" | "allCities";
  /** 都道府県コード（2桁）。type="city" の場合に必要 */
  prefCode?: string;
  /** 政令指定都市の区表示モード */
  wardMode?: DesignatedCityWardMode;
}

/**
 * MLIT TopoJSON の R2 相対パスを構築
 *
 * @example
 * buildMlitR2Path({ type: "prefecture" })
 * // → "gis/mlit/20240101/prefecture.topojson"
 *
 * buildMlitR2Path({ type: "city", prefCode: "13", wardMode: "merged" })
 * // → "gis/mlit/20240101/13/13_city_dc.topojson"
 *
 * buildMlitR2Path({ type: "city", prefCode: "13", wardMode: "split" })
 * // → "gis/mlit/20240101/13/13_city.topojson"
 *
 * buildMlitR2Path({ type: "allCities", wardMode: "split" })
 * // → "gis/mlit/20240101/jp_city.topojson"
 */
export function buildMlitR2Path(options: MlitR2PathOptions): string {
  const { type, prefCode, wardMode = "merged" } = options;

  if (type === "prefecture") {
    return `${R2_MLIT_PREFIX}${MLIT_VERSION}/prefecture.topojson`;
  }

  if (type === "allCities") {
    const filename =
      wardMode === "merged" ? "jp_city_dc.topojson" : "jp_city.topojson";
    return `${R2_MLIT_PREFIX}${MLIT_VERSION}/${filename}`;
  }

  // type === "city"
  if (!prefCode) {
    throw new Error("prefCode is required for type=city");
  }
  // 補間する直前に書式を検証する。ここは R2 key とローカルのファイルパスの両方になるので、
  // 2 桁の数字以外を通すとパストラバーサルの経路になる (CODEQL-JS-BACKLOG-01)。
  const safePrefCode = assertPrefectureCode(prefCode, "buildMlitR2Path");
  const suffix = wardMode === "merged" ? "_city_dc" : "_city";
  return `${R2_MLIT_PREFIX}${MLIT_VERSION}/${safePrefCode}/${safePrefCode}${suffix}.topojson`;
}
