import "server-only";

import { logger } from "@stats47/logger/server";
import { readStatsValues } from "@stats47/stats-r2";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import type { RankingValue } from "../../types";

/**
 * 全年分の RankingValue を R2 から一括取得 (Bar Chart Race 用)。
 * 全国値 (areaCode "00000") は除外。
 * Phase 6 以降: `app/stats/<metric>/values.json` (R2) から読む。
 */
export async function listRankingValuesAllYears(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<RankingValue[], Error>> {
  try {
    if (areaType === "national") return ok([]);
    const payload = await readStatsValues(rankingKey, areaType);
    if (!payload) return ok([]);

    const values: RankingValue[] = payload.rows
      .filter((r) => r.areaCode !== "00000" && r.value !== null)
      .map((row) => ({
        areaType,
        areaCode: row.areaCode,
        areaName: row.areaName,
        yearCode: String(row.yearCode),
        yearName: row.yearName,
        metricKey: rankingKey,
        value: Number(row.value),
        unit: row.unit ?? "",
        rank: row.rank != null ? Number(row.rank) : 0,
      }));

    return ok(values);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "listRankingValuesAllYears: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
