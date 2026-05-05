import "server-only";

import { getDrizzle, getAreaNameMap, metrics, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { formatYearName } from "@stats47/types";
import { and, eq, ne } from "drizzle-orm";
import type { RankingValue } from "../../types";

/**
 * 全年分の RankingValue を一括取得する（Bar Chart Race 用）
 *
 * 全国値（areaCode "00000"）は除外する。
 */
export async function listRankingValuesAllYears(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingValue[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const [result, areaNameMap] = await Promise.all([
      drizzleDb
        .select({
          areaCode: observations.areaCode,
          yearCode: observations.yearCode,
          metricKey: metrics.key,
          value: observations.value,
          unit: metrics.unit,
          rank: observations.rank,
          yearFormat: metrics.yearFormat,
        })
        .from(observations)
        .innerJoin(metrics, eq(observations.metricId, metrics.id))
        .where(
          and(
            eq(metrics.key, rankingKey),
            eq(metrics.areaType, areaType),
            ne(observations.areaCode, "00000")
          )
        ),
      getAreaNameMap(areaType, drizzleDb),
    ]);

    const values: RankingValue[] = result.map((row) => ({
      areaType,
      areaCode: row.areaCode,
      areaName: areaNameMap.get(row.areaCode) ?? row.areaCode,
      yearCode: String(row.yearCode),
      yearName: formatYearName(String(row.yearCode), row.yearFormat ?? "fiscal"),
      metricKey: row.metricKey,
      value: row.value !== null ? Number(row.value) : 0,
      unit: row.unit ?? "",
      rank: row.rank != null ? Number(row.rank) : 0,
    }));

    return ok(values);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "listRankingValuesAllYears: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
