import "server-only";

import { getDrizzle, metrics, observations } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { eq, sql } from "drizzle-orm";
import type { RankingItemCounts } from "../../types";

export async function getRankingItemStats(
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItemCounts[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select({
        areaType: observations.areaType,
        total: sql<number>`COUNT(DISTINCT ${observations.metricKey})`,
        active: sql<number>`COUNT(DISTINCT CASE WHEN ${metrics.isActive} = 1 THEN ${observations.metricKey} END)`,
        inactive: sql<number>`COUNT(DISTINCT CASE WHEN ${metrics.isActive} = 0 THEN ${observations.metricKey} END)`,
      })
      .from(observations)
      .innerJoin(metrics, eq(observations.metricKey, metrics.key))
      .groupBy(observations.areaType);

    return ok(
      rows.map((row) => ({
        areaType: row.areaType,
        total: Number(row.total),
        active: Number(row.active),
        inactive: Number(row.inactive),
      }))
    );
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
