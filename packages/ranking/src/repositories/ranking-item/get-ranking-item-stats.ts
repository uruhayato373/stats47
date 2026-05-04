import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { count, sql } from "drizzle-orm";
import type { RankingItemCounts } from "../../types";

export async function getRankingItemStats(
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItemCounts[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select({
        areaType: metrics.areaType,
        total: count(),
        active: sql<number>`SUM(CASE WHEN ${metrics.isActive} = 1 THEN 1 ELSE 0 END)`,
        inactive: sql<number>`SUM(CASE WHEN ${metrics.isActive} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(metrics)
      .groupBy(metrics.areaType);

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
