import "server-only";

import { getDrizzle, metrics, stats } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { and, desc, eq, exists, sql } from "drizzle-orm";

export async function findFirstKeyByTag(
  tagKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<string, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select({ rankingKey: metrics.key })
      .from(metrics)
      .where(
        and(
          sql`EXISTS (SELECT 1 FROM json_each(${metrics.tags}) WHERE value = ${tagKey})`,
          eq(metrics.isActive, true),
          exists(
            drizzleDb.select({ metricKey: stats.metricKey })
              .from(stats)
              .where(and(
                eq(stats.metricKey, metrics.key),
                eq(stats.areaType, "prefecture")
              ))
          )
        )
      )
      .orderBy(desc(metrics.updatedAt))
      .limit(1);

    if (result.length === 0) {
      return err(new Error(`First ranking key not found for tagKey: ${tagKey}`));
    }
    return ok(result[0].rankingKey);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
