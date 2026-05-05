import "server-only";

import { getDrizzle, metrics, stats } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, count, eq, exists } from "drizzle-orm";

type ValidAreaType = "prefecture" | "city" | "port" | "fishing_port";

export async function countRankingItemsByAreaType(
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<number, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select({ count: count() })
      .from(metrics)
      .where(
        exists(
          drizzleDb.select({ metricKey: stats.metricKey })
            .from(stats)
            .where(and(
              eq(stats.metricKey, metrics.key),
              eq(stats.areaType, areaType as ValidAreaType)
            ))
        )
      );
    return ok(result[0]?.count || 0);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
