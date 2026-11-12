import "server-only";

import type { AreaType } from "@stats47/types";

import cities from "../../../../data/areas/master/cities.json";
import ports from "../../../../data/areas/master/ports.json";
import prefectures from "../../../../data/areas/master/prefectures.json";

/**
 * area_type × area_code → area_name のバルク lookup マップを返す。
 *
 * 完全DBレス (docs/01_技術設計/19): D1 prefectures/cities/ports テーブルではなく
 * 台帳 areas.prefectures / areas.cities / areas.ports (data/areas/master/*.json) から読む。
 *   prefecture → prefCode / prefName
 *   city       → cityCode / cityName
 *   port       → portCode / portName
 */
export async function getAreaNameMap(areaType: AreaType): Promise<Map<string, string>> {
  switch (areaType) {
    case "prefecture":
      return new Map(prefectures.map((r) => [r.prefCode, r.prefName]));
    case "city":
      return new Map(cities.map((r) => [r.cityCode, r.cityName]));
    case "port":
      return new Map(ports.map((r) => [r.portCode, r.portName]));
    default:
      return new Map();
  }
}
