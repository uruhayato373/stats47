import "server-only";

import { getDrizzle, rankingTags } from "@stats47/database/server";
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
      .delete(rankingTags)
      .where(
        and(
          eq(rankingTags.rankingKey, rankingKey),
          eq(rankingTags.areaType, areaType)
        )
      );

    if (tagKeys.length > 0) {
      await drizzleDb.insert(rankingTags).values(
        tagKeys.map((tagKey) => ({
          rankingKey,
          areaType,
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
