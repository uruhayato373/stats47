import "server-only";

import { getDrizzle, stats } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
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
          eq(stats.areaType, "city"),
          eq(stats.yearCode, yearCode),
          like(stats.areaCode, prefPrefix)
        )
      );

    const values: RankingValue[] = result.map((row) => ({
      areaType: "city" as AreaType,
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
    logger.error({ error, rankingKey, yearCode, prefCode }, "listRankingValuesByPrefecture: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
