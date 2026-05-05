import "server-only";

import { getDrizzle, taggings } from "@stats47/database/server";
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

    await drizzleDb
      .delete(taggings)
      .where(
        and(
          eq(taggings.taggableType, "metric"),
          eq(taggings.taggableId, rankingKey)
        )
      );

    if (tagKeys.length > 0) {
      await drizzleDb.insert(taggings).values(
        tagKeys.map((tagKey) => ({
          taggableType: "metric" as const,
          taggableId: rankingKey,
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
