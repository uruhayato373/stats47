import "server-only";

import { getDrizzle, observations } from "@stats47/database/server";
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
        areaCode: observations.areaCode,
        areaName: observations.areaName,
        yearCode: observations.yearCode,
        yearName: observations.yearName,
        metricKey: observations.metricKey,
        value: observations.value,
        unit: observations.unit,
        rank: observations.rank,
      })
      .from(observations)
      .where(
        and(
          eq(observations.metricKey, rankingKey),
          eq(observations.areaType, areaType as "prefecture" | "city" | "port" | "fishing_port"),
          or(
            eq(observations.yearCode, yearCode),
            like(observations.yearCode, `${yearCode}%`)
          )
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
    logger.error({ error, rankingKey, areaType, yearCode }, "listRankingValues: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
