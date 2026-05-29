import "server-only";

import { logger } from "@stats47/logger/server";
import { readStatsValues } from "@stats47/stats-r2";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import type { RankingValue } from "../../types";

/**
 * 指定都道府県に属する市区町村のランキング値を R2 から取得 (Phase 6 cutover)。
 * area_code の先頭 2 桁で memory フィルタする。
 */
export async function listRankingValuesByPrefecture(
  rankingKey: string,
  yearCode: string,
  prefCode: string,
): Promise<Result<RankingValue[], Error>> {
  try {
    const payload = await readStatsValues(rankingKey, "city");
    if (!payload) return ok([]);
    const prefPrefix = prefCode.slice(0, 2);

    const values: RankingValue[] = payload.rows
      .filter(
        (r) =>
          String(r.yearCode) === yearCode &&
          r.areaCode.startsWith(prefPrefix),
      )
      .map((row) => ({
        areaType: "city" as AreaType,
        areaCode: row.areaCode,
        areaName: row.areaName,
        yearCode: String(row.yearCode),
        yearName: row.yearName,
        metricKey: rankingKey,
        value: row.value !== null ? Number(row.value) : 0,
        unit: row.unit ?? "",
        rank: row.rank != null ? Number(row.rank) : 0,
      }));

    return ok(values);
  } catch (error) {
    logger.error({ error, rankingKey, yearCode, prefCode }, "listRankingValuesByPrefecture: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
