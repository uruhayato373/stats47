import "server-only";

import { getDrizzle, stats } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
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
    const result = await drizzleDb
      .select({
        areaCode: stats.areaCode,
        areaName: stats.areaName,
        yearCode: stats.yearCode,
        yearName: stats.yearName,
        metricKey: stats.metricKey,
        value: stats.value,
        unit: stats.unit,
        rank: stats.rank,
      })
      .from(stats)
      .where(
        and(
          eq(stats.metricKey, rankingKey),
          eq(stats.areaType, areaType as "prefecture" | "city" | "port" | "fishing_port"),
          ne(stats.areaCode, "00000")
        )
      );

    const values: RankingValue[] = result.map((row) => ({
      areaType,
      areaCode: row.areaCode,
      areaName: row.areaName,
      yearCode: String(row.yearCode),
      yearName: row.yearName,
      metricKey: row.metricKey,
      value: row.value !== null ? Number(row.value) : 0,
      unit: row.unit,
      rank: row.rank != null ? Number(row.rank) : 0,
    }));

    return ok(values);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "listRankingValuesAllYears: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
