import "server-only";

import { getDrizzle, metrics, stats } from "@stats47/database/server";
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
        areaType: stats.areaType,
        total: sql<number>`COUNT(DISTINCT ${stats.metricKey})`,
        active: sql<number>`COUNT(DISTINCT CASE WHEN ${metrics.isActive} = 1 THEN ${stats.metricKey} END)`,
        inactive: sql<number>`COUNT(DISTINCT CASE WHEN ${metrics.isActive} = 0 THEN ${stats.metricKey} END)`,
      })
      .from(stats)
      .innerJoin(metrics, eq(stats.metricKey, metrics.key))
      .groupBy(stats.areaType);

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
