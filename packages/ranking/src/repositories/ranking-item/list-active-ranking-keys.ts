import "server-only";

import { getDrizzle, metrics, statsPrefecture } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq, exists } from "drizzle-orm";

type ValidAreaType = "prefecture" | "city" | "port";

export async function listActiveRankingKeys(
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<{ rankingKey: string; areaType: string }[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .select({ rankingKey: metrics.key })
      .from(metrics)
      .where(
        and(
          exists(
            drizzleDb.select({ metricKey: statsPrefecture.metricKey })
              .from(statsPrefecture)
              .where(and(
                eq(statsPrefecture.metricKey, metrics.key),
              ))
          ),
          eq(metrics.isActive, true)
        )
      );
    return ok(results.map((r) => ({ rankingKey: r.rankingKey, areaType })));
  } catch (error) {
    logger.error({ error, areaType }, "listActiveRankingKeys: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
