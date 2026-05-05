import "server-only";

import { getDrizzle, metrics, taggings } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq, sql } from "drizzle-orm";

export async function getTagsForItem(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Array<{ tagKey: string }>, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .select({ tagKey: taggings.tagKey })
      .from(taggings)
      .innerJoin(
        metrics,
        eq(taggings.taggableId, sql`CAST(${metrics.id} AS TEXT)`)
      )
      .where(
        and(
          eq(taggings.taggableType, "metric"),
          eq(metrics.key, rankingKey)
        )
      );

    return ok(results.map((row) => ({ tagKey: row.tagKey })));
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "getTagsForItem: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
