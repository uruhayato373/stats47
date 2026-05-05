import "server-only";

import { getDrizzle, statsPrefecture } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { sql } from "drizzle-orm";
import type { RankingValue } from "../../types";

export async function upsertRankingValues(
  rankingKey: string,
  areaType: string,
  yearCode: string,
  values: RankingValue[],
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<number, Error>> {
  if (values.length === 0) return ok(0);
  try {
    const drizzleDb = db ?? getDrizzle();

    const rows = values.map((v) => ({
      metricKey: rankingKey,
      areaCode: v.areaCode,
      areaName: v.areaName,
      yearCode: v.yearCode ?? yearCode,
      yearName: v.yearName,
      value: v.value,
      unit: v.unit,
      rank: typeof v.rank === "number" ? v.rank : null,
    }));

    await drizzleDb
      .insert(statsPrefecture)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          statsPrefecture.metricKey,
          statsPrefecture.areaCode,
          statsPrefecture.yearCode,
        ],
        set: {
          areaName: sql.raw("excluded.area_name"),
          yearName: sql.raw("excluded.year_name"),
          value: sql.raw("excluded.value"),
          unit: sql.raw("excluded.unit"),
          rank: sql.raw("excluded.rank"),
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
