import "server-only";

import { getDrizzle, rankingData } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { sql } from "drizzle-orm";
import type { RankingValue } from "../../types";

export async function upsertRankingValues(
  rankingKey: string,
  areaType: string,
  yearCode: string,
  yearName: string | undefined,
  categoryName: string,
  values: RankingValue[],
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<number, Error>> {
  if (values.length === 0) return ok(0);
  try {
    const rows = values.map((v) => ({
      areaType: v.areaType ?? areaType,
      areaCode: v.areaCode,
      areaName: v.areaName,
      yearCode: v.yearCode ?? yearCode,
      yearName: v.yearName ?? yearName,
      categoryCode: rankingKey,
      categoryName: v.categoryName ?? categoryName,
      value: v.value,
      unit: v.unit ?? null,
      rank: typeof v.rank === "number" ? v.rank : null,
    }));

    const drizzleDb = db ?? getDrizzle();
    await drizzleDb
      .insert(rankingData)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          rankingData.areaType,
          rankingData.categoryCode,
          rankingData.yearCode,
          rankingData.areaCode,
        ],
        set: {
          areaName: sql.raw("excluded.area_name"),
          yearName: sql.raw("excluded.year_name"),
          categoryName: sql.raw("excluded.category_name"),
          value: sql.raw("excluded.value"),
          unit: sql.raw("excluded.unit"),
          rank: sql.raw("excluded.rank"),
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    logger.debug(
      { rankingKey, areaType, yearCode, count: values.length },
      "upsertRankingValues: 完了"
    );
    return ok(values.length);
  } catch (error) {
    logger.error({ error, rankingKey, areaType, yearCode }, "upsertRankingValues: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
