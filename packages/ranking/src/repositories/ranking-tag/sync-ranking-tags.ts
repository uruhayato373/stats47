import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { eq } from "drizzle-orm";

export async function syncRankingTags(
  rankingKey: string,
  areaType: string,
  tagKeys: string[],
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<boolean, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();

    await drizzleDb
      .update(metrics)
      .set({ tags: JSON.stringify(tagKeys) })
      .where(eq(metrics.key, rankingKey));

    return ok(true);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "syncRankingTags: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
