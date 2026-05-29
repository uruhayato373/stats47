import "server-only";

import { getDrizzle } from "@stats47/database/server";
import { readStatsValues } from "@stats47/stats-r2";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";

/**
 * Phase 6: 「サイト全体で利用可能な年」を japanese-population (1980-2024 等) から代理取得する。
 * 完全な global DISTINCT は R2 全 metric scan が必要なため、主要 metric を proxy にする。
 */
export async function getAllAvailableYears(
  _areaType: AreaType,
  _db?: ReturnType<typeof getDrizzle>,
): Promise<Result<Array<{ year: string; name: string }>, Error>> {
  try {
    const payload = await readStatsValues("japanese-population", "prefecture");
    if (!payload) return ok([]);
    const map = new Map<string, string>();
    for (const r of payload.rows) {
      if (!map.has(r.yearCode)) map.set(r.yearCode, r.yearName || `${r.yearCode}年度`);
    }
    const sorted = Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([year, name]) => ({ year, name }));
    return ok(sorted);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
