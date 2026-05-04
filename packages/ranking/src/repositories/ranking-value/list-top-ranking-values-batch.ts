import "server-only";

import { getDrizzle, indicators, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq, inArray } from "drizzle-orm";
import type { RankingValue } from "../../types";

/**
 * 複数ランキングキーの rank=1 データを一括取得する。
 * FeaturedRankings 等で N 個の個別クエリを 1 クエリに統合するために使用。
 *
 * @returns Map<rankingKey, RankingValue> — 各ランキングのトップ1を返す
 */
export async function listTopRankingValuesBatch(
  items: { rankingKey: string; yearCode: string }[],
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Map<string, RankingValue>, Error>> {
  try {
    if (items.length === 0) {
      return ok(new Map());
    }

    const drizzleDb = db ?? getDrizzle();
    const rankingKeys = items.map((i) => i.rankingKey);

    const result = await drizzleDb
      .select({
        areaType: observations.entityType,
        areaCode: observations.entityCode,
        areaName: observations.entityName,
        yearCode: observations.yearCode,
        yearName: observations.yearName,
        categoryCode: indicators.key,
        categoryName: observations.categoryName,
        value: observations.valueNumeric,
        unit: observations.unit,
        rank: observations.rank,
      })
      .from(observations)
      .innerJoin(indicators, eq(observations.indicatorId, indicators.id))
      .where(
        and(
          inArray(indicators.key, rankingKeys),
          eq(indicators.areaType, areaType),
          eq(observations.rank, 1)
        )
      );

    const yearByKey = new Map(items.map((i) => [i.rankingKey, i.yearCode]));
    const topMap = new Map<string, RankingValue>();

    for (const row of result) {
      const key = row.categoryCode || "";
      const expectedYear = yearByKey.get(key);
      if (expectedYear && String(row.yearCode) === expectedYear) {
        topMap.set(key, {
          areaType: row.areaType as AreaType,
          areaCode: row.areaCode || "",
          areaName: row.areaName || "",
          yearCode: row.yearCode ? String(row.yearCode) : "",
          yearName: row.yearName || `${row.yearCode}年度`,
          categoryCode: key,
          categoryName: row.categoryName || "",
          value: row.value !== null ? Number(row.value) : 0,
          unit: row.unit || "",
          rank: row.rank != null ? Number(row.rank) : 0,
        });
      }
    }

    return ok(topMap);
  } catch (error) {
    logger.error({ error, areaType }, "listTopRankingValuesBatch: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
