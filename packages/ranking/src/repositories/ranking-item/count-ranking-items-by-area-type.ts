import "server-only";

import { getDrizzle, metrics, statsPrefecture } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, count, eq, exists } from "drizzle-orm";

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
          drizzleDb.select({ metricKey: statsPrefecture.metricKey })
            .from(statsPrefecture)
            .where(
              eq(statsPrefecture.metricKey, metrics.key)
            )
        )
      );
    return ok(result[0]?.count || 0);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
