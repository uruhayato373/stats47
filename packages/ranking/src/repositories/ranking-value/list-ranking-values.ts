import "server-only";

import { getDrizzle, getAreaNameMap, metrics, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { formatYearName } from "@stats47/types";
import { and, eq, like, or } from "drizzle-orm";
import type { RankingValue } from "../../types";

export async function listRankingValues(
  rankingKey: string,
  areaType: AreaType,
  yearCode: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingValue[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const [result, areaNameMap] = await Promise.all([
      drizzleDb
        .select({
          areaCode: observations.areaCode,
          yearCode: observations.yearCode,
          categoryCode: metrics.key,
          categoryName: metrics.title,
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
            or(
              eq(observations.yearCode, yearCode),
              like(observations.yearCode, `${yearCode}%`)
            )
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
      categoryCode: row.categoryCode,
      categoryName: row.categoryName ?? "",
      value: row.value !== null ? Number(row.value) : 0,
      unit: row.unit ?? "",
      rank: row.rank != null ? Number(row.rank) : 0,
    }));

    return ok(values);
  } catch (error) {
    logger.error({ error, rankingKey, areaType, yearCode }, "listRankingValues: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
