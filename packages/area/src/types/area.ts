/**
 * 地域エンティティ（判別共用体）
 *
 * 全国・都道府県・市区町村を統一的に扱う型。
 * `areaType` によって `parentAreaCode` の有無が決まる。
 */
export type Area =
  | { areaCode: string; areaName: string; areaType: "national" }
  | { areaCode: string; areaName: string; areaType: "prefecture" }
  | { areaCode: string; areaName: string; areaType: "city"; parentAreaCode: string };
