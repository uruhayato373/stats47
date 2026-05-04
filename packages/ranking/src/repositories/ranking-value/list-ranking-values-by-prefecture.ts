import "server-only";

import { getDrizzle, metrics, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq, like } from "drizzle-orm";
import type { RankingValue } from "../../types";

/**
 * 指定都道府県に属する市区町村のランキングデータを取得
 *
 * entity_code の先頭2桁（都道府県コード）で LIKE フィルタし、
 * 全国データを JS でフィルタするより効率的。
 */
export async function listRankingValuesByPrefecture(
  rankingKey: string,
  yearCode: string,
  prefCode: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingValue[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const prefPrefix = prefCode.slice(0, 2) + "%";
    const result = await drizzleDb
      .select({
        areaType: observations.entityType,
        areaCode: observations.entityCode,
        areaName: observations.entityName,
        yearCode: observations.yearCode,
        yearName: observations.yearName,
        categoryCode: metrics.key,
        categoryName: observations.categoryName,
        value: observations.valueNumeric,
        unit: observations.unit,
        rank: observations.rank,
      })
      .from(observations)
      .innerJoin(metrics, eq(observations.metricId, metrics.id))
      .where(
        and(
          eq(metrics.key, rankingKey),
          eq(metrics.areaType, "city"),
          eq(observations.entityType, "city"),
          eq(observations.yearCode, yearCode),
          like(observations.entityCode, prefPrefix)
        )
      );

    const values: RankingValue[] = result.map((row) => ({
      areaType: row.areaType as AreaType,
      areaCode: row.areaCode || "",
      areaName: row.areaName || "",
      yearCode: row.yearCode ? String(row.yearCode) : "",
      yearName: row.yearName || `${row.yearCode}年度`,
      categoryCode: row.categoryCode || "",
      categoryName: row.categoryName || "",
      value: row.value !== null ? Number(row.value) : 0,
      unit: row.unit || "",
      rank: row.rank != null ? Number(row.rank) : 0,
    }));

    return ok(values);
  } catch (error) {
    logger.error({ error, rankingKey, yearCode, prefCode }, "listRankingValuesByPrefecture: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
