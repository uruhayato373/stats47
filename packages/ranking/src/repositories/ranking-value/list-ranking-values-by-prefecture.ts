import "server-only";

import { getDrizzle, getAreaNameMap, metrics, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { formatYearName } from "@stats47/types";
import { and, eq, like } from "drizzle-orm";
import type { RankingValue } from "../../types";

/**
 * 指定都道府県に属する市区町村のランキングデータを取得
 *
 * area_code の先頭2桁（都道府県コード）で LIKE フィルタし、
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
            eq(metrics.areaType, "city"),
            eq(observations.areaType, "city"),
            eq(observations.yearCode, yearCode),
            like(observations.areaCode, prefPrefix)
          )
        ),
      getAreaNameMap("city", drizzleDb),
    ]);

    const values: RankingValue[] = result.map((row) => ({
      areaType: "city" as AreaType,
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
    logger.error({ error, rankingKey, yearCode, prefCode }, "listRankingValuesByPrefecture: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
