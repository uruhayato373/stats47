import "server-only";

import { logger } from "@stats47/logger/server";
import { readStatsValues } from "@stats47/stats-r2";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import type { RankingValue } from "../../types";
import { deriveRanks } from "../../utils/derive-ranks";

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

    const inYear = payload.rows.filter(
      (row) => !yearCode || row.yearCode === yearCode || row.yearCode.startsWith(yearCode),
    );
    // 手動投入 metric (fetcherKey:"manual") は app/stats の行が rank を持たない。正典が rank を
    // 1 件も持たない年に限り、配信用 values と同一規則 (deriveRanks) で導出する。2026-10-09 に
    // 食塩・野菜の摂取量など 5 指標が県データブックで「値なし」になった (rank 欠落行を捨てていた)。
    const rankable = inYear.map((row) => ({ row, value: row.value, rank: row.rank ?? null }));
    if (rankable.every((e) => e.rank == null)) deriveRanks(rankable);
    // R2 は対象外・未集計の地域を value/rank=null の行として保持する。
    // 0 に変換すると実在の観測値と区別できなくなるため、ランキング値として返さない。
    const filtered = rankable
      .filter((e) => e.value !== null && e.rank != null)
      .map((e) => ({ ...e.row, rank: e.rank }));

    const values: RankingValue[] = filtered.map((row) => ({
      areaType,
      areaCode: row.areaCode ?? "",
      areaName: row.areaName ?? "",
      yearCode: String(row.yearCode ?? ""),
      yearName: row.yearName ?? "",
      metricKey: rankingKey,
      value: Number(row.value),
      unit: row.unit ?? "",
      rank: Number(row.rank),
    }));

    return ok(values);
  } catch (error) {
    logger.error({ error, rankingKey, areaType, yearCode }, "listRankingValues: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
