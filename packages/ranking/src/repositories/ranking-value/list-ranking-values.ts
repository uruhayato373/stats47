import "server-only";

import { logger } from "@stats47/logger/server";
import { readStatsValues } from "@stats47/stats-r2";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import type { RankingValue } from "../../types";

/**
 * Phase 6 以降: R2 (`app/stats/<metric>/values.json`) から取得。
 * areaType が prefecture/city/port のいずれかに応じて R2 key を分岐。
 * yearCode が指定された場合は memory フィルタ。
 */
export async function listRankingValues(
  rankingKey: string,
  areaType: AreaType,
  yearCode: string,
): Promise<Result<RankingValue[], Error>> {
  try {
    if (areaType === "national") {
      return ok([]);
    }
    const payload = await readStatsValues(rankingKey, areaType);
    if (!payload) return ok([]);

    const filtered = payload.rows.filter((r) => {
      if (!yearCode) return true;
      return r.yearCode === yearCode || r.yearCode.startsWith(yearCode);
    });

    const values: RankingValue[] = filtered.map((row) => ({
      areaType,
      areaCode: row.areaCode ?? "",
      areaName: row.areaName ?? "",
      yearCode: String(row.yearCode ?? ""),
      yearName: row.yearName ?? "",
      metricKey: rankingKey,
      value: row.value != null ? Number(row.value) : 0,
      unit: row.unit ?? "",
      rank: row.rank != null ? Number(row.rank) : 0,
    }));

    return ok(values);
  } catch (error) {
    logger.error({ error, rankingKey, areaType, yearCode }, "listRankingValues: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
