import "server-only";

import { readStatsValues } from "@stats47/stats-r2";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";

/**
 * Phase 6 以降: R2 payload から DISTINCT yearCode を抽出 (降順)。
 */
export async function getAvailableYears(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<Array<{ yearCode: string; yearName: string }>, Error>> {
  try {
    if (areaType === "national") return ok([]);
    const payload = await readStatsValues(rankingKey, areaType);
    if (!payload) return ok([]);

    const byYear = new Map<string, string>();
    for (const row of payload.rows) {
      if (!byYear.has(row.yearCode)) {
        byYear.set(row.yearCode, row.yearName || `${row.yearCode}年度`);
      }
    }

    const sorted = Array.from(byYear.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([yearCode, yearName]) => ({ yearCode, yearName }));

    return ok(sorted);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
