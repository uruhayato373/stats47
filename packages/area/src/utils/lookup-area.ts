import { CITIES, PREFECTURES } from "../data";
import { NATIONAL_AREA } from "../constants/national";
import type { Area } from "../types/area";
import type { Prefecture } from "../types/prefecture";

/** モジュールロード時に Map を構築 — O(1) ルックアップ用 */
const CITY_MAP = new Map(CITIES.map((c) => [c.cityCode, c]));

function toPrefectureArea(pref: Prefecture): Area {
  return { areaCode: pref.prefCode, areaName: pref.prefName, areaType: "prefecture" };
}

/**
 * 地域コードから地域情報を検索
 *
 * @param areaCode - 地域コード（5桁形式）
 * @returns 地域情報。見つからない場合は null
 *
 * @example
 * ```ts
 * lookupArea("00000");
 * // { areaCode: "00000", areaName: "全国", areaType: "national" }
 *
 * lookupArea("13000");
 * // { areaCode: "13000", areaName: "東京都", areaType: "prefecture" }
 *
 * lookupArea("13101");
 * // { areaCode: "13101", areaName: "千代田区", areaType: "city", parentAreaCode: "13000" }
 * ```
 */
export function lookupArea(areaCode: string): Area | null {
  if (!areaCode) {
    return null;
  }

  // 全国
  if (areaCode === "00000") {
    return NATIONAL_AREA;
  }

  // 都道府県（末尾000）
  if (areaCode.endsWith("000")) {
    const pref = PREFECTURES.find((p) => p.prefCode === areaCode);
    return pref ? toPrefectureArea(pref) : null;
  }

  // 市区町村
  const city = CITY_MAP.get(areaCode);
  if (city) {
    return {
      areaCode: city.cityCode,
      areaName: city.cityName,
      areaType: "city",
      parentAreaCode: city.prefCode,
    };
  }

  return null;
}
