import "server-only";

import type { AreaType } from "@stats47/types";

import { getDrizzle } from "../drizzle";
import { cities, ports, prefectures } from "../schema";

/**
 * area_type × area_code → area_name のバルク lookup マップを返す
 *
 * テーブル:
 *   prefecture → prefectures.code / prefectures.name
 *   city       → cities.code / cities.name
 *   port       → ports.port_code / ports.port_name
 */
export async function getAreaNameMap(
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Map<string, string>> {
  const drizzleDb = db ?? getDrizzle();

  switch (areaType) {
    case "prefecture": {
      const rows = await drizzleDb
        .select({ code: prefectures.code, name: prefectures.name })
        .from(prefectures);
      return new Map(rows.map((r) => [r.code, r.name]));
    }
    case "city": {
      const rows = await drizzleDb
        .select({ code: cities.code, name: cities.name })
        .from(cities);
      return new Map(rows.map((r) => [r.code, r.name]));
    }
    case "port": {
      const rows = await drizzleDb
        .select({ code: ports.portCode, name: ports.portName })
        .from(ports);
      return new Map(rows.map((r) => [r.code, r.name]));
    }
    default:
      return new Map();
  }
}
