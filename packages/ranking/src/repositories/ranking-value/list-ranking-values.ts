import "server-only";

import { getDrizzle, indicators, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
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
          eq(indicators.key, rankingKey),
          eq(indicators.areaType, areaType),
          or(
            eq(observations.yearCode, yearCode),
            like(observations.yearCode, `${yearCode}%`)
          )
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
    logger.error({ error, rankingKey, areaType, yearCode }, "listRankingValues: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
