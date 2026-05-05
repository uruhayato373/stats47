import "server-only";

import { getDrizzle, metrics, observations, taggings } from "@stats47/database/server";
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
      .innerJoin(
        taggings,
        eq(taggings.taggableId, sql`CAST(${metrics.id} AS TEXT)`)
      )
      .where(
        and(
          eq(taggings.taggableType, "metric"),
          eq(taggings.tagKey, tagKey),
          eq(metrics.isActive, true),
          exists(
            drizzleDb.select({ metricKey: observations.metricKey })
              .from(observations)
              .where(and(
                eq(observations.metricKey, metrics.key),
                eq(observations.areaType, "prefecture")
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
