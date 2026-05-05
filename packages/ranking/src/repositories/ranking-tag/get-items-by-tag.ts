import "server-only";

import { getDrizzle, metrics, stats } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq, exists, sql } from "drizzle-orm";

type ValidAreaType = "prefecture" | "city" | "port" | "fishing_port";

export async function getItemsByTag(
  tagKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Array<{ rankingKey: string; areaType: string }>, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .select({ rankingKey: metrics.key })
      .from(metrics)
      .where(
        and(
          sql`EXISTS (SELECT 1 FROM json_each(${metrics.tags}) WHERE value = ${tagKey})`,
          exists(
            drizzleDb.select({ metricKey: stats.metricKey })
              .from(stats)
              .where(and(
                eq(stats.metricKey, metrics.key),
                eq(stats.areaType, areaType as ValidAreaType)
              ))
          )
        )
      );

    return ok(results.map((r) => ({ rankingKey: r.rankingKey, areaType })));
  } catch (error) {
    logger.error({ error, tagKey, areaType }, "getItemsByTag: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
