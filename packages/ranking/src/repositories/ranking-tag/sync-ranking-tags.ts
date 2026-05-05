import "server-only";

import { getDrizzle, metrics, taggings } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, eq } from "drizzle-orm";

export async function syncRankingTags(
  rankingKey: string,
  areaType: string,
  tagKeys: string[],
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<boolean, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();

    const indicatorRow = await drizzleDb
      .select({ id: metrics.id })
      .from(metrics)
      .where(eq(metrics.key, rankingKey))
      .limit(1);

    if (indicatorRow.length === 0) {
      return err(
        new Error(`indicator not found: key=${rankingKey}`)
      );
    }
    const metricId = String(indicatorRow[0].id);

    await drizzleDb
      .delete(taggings)
      .where(
        and(
          eq(taggings.taggableType, "metric"),
          eq(taggings.taggableId, metricId)
        )
      );

    if (tagKeys.length > 0) {
      await drizzleDb.insert(taggings).values(
        tagKeys.map((tagKey) => ({
          taggableType: "metric" as const,
          taggableId: metricId,
          tagKey,
          createdAt: new Date().toISOString(),
        }))
      );
    }

    return ok(true);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "syncRankingTags: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
