import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { AreaType } from "@stats47/types";

/**
 * area_type × area_code → area_name のバルク lookup マップを返す。
 *
 * 完全DBレス (docs/01_技術設計/19): D1 prefectures/cities/ports テーブルではなく
 * git TS の area マスタ (packages/area/src/data/*.json) から読む。
 *   prefecture → prefectures.json (prefCode / prefName)
 *   city       → cities.json      (cityCode / cityName)
 *   port       → ports.json       (portCode / portName)
 */
const AREA_DATA_DIR = path.resolve(__dirname, "../../../area/src/data");

function readJson<T>(file: string): T[] {
  return JSON.parse(fs.readFileSync(path.join(AREA_DATA_DIR, file), "utf-8")) as T[];
}

export async function getAreaNameMap(areaType: AreaType): Promise<Map<string, string>> {
  switch (areaType) {
    case "prefecture": {
      const rows = readJson<{ prefCode: string; prefName: string }>("prefectures.json");
      return new Map(rows.map((r) => [r.prefCode, r.prefName]));
    }
    case "city": {
      const rows = readJson<{ cityCode: string; cityName: string }>("cities.json");
      return new Map(rows.map((r) => [r.cityCode, r.cityName]));
    }
    case "port": {
      const rows = readJson<{ portCode: string; portName: string }>("ports.json");
      return new Map(rows.map((r) => [r.portCode, r.portName]));
    }
    default:
      return new Map();
  }
}
