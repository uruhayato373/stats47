import "server-only";

import { getDrizzle, rankingData } from "@stats47/database/server";
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
    // yearCode は "2023" のような4桁形式だが、DBには "2023100000" のような
    // e-Stat API 形式で保存されているケースがある。両方マッチさせる。
    const result = await drizzleDb
      .select()
      .from(rankingData)
      .where(
        and(
          eq(rankingData.categoryCode, rankingKey),
          eq(rankingData.areaType, areaType),
          or(
            eq(rankingData.yearCode, yearCode),
            like(rankingData.yearCode, `${yearCode}%`)
          )
        )
      );

    const values: RankingValue[] = result.map((row: any) => ({
      areaType: row.areaType,
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
