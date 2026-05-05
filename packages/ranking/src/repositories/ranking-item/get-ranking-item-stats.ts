import "server-only";

import { getDrizzle, metrics, statsPrefecture } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { eq, sql } from "drizzle-orm";
import type { RankingItemCounts } from "../../types";

export async function getRankingItemStats(
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItemCounts[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const row = await drizzleDb
      .select({
        total: sql<number>`COUNT(DISTINCT ${statsPrefecture.metricKey})`,
        active: sql<number>`COUNT(DISTINCT CASE WHEN ${metrics.isActive} = 1 THEN ${statsPrefecture.metricKey} END)`,
        inactive: sql<number>`COUNT(DISTINCT CASE WHEN ${metrics.isActive} = 0 THEN ${statsPrefecture.metricKey} END)`,
      })
      .from(statsPrefecture)
      .innerJoin(metrics, eq(statsPrefecture.metricKey, metrics.key))
      .then((rows) => rows[0]);

    return ok([
      {
        areaType: "prefecture" as const,
        total: Number(row?.total ?? 0),
        active: Number(row?.active ?? 0),
        inactive: Number(row?.inactive ?? 0),
      },
    ]);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
