import "server-only";

import { getDrizzle, rankingTags } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";

export async function getTagsForItem(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Array<{ tagKey: string }>, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .select({ tagKey: rankingTags.tagKey })
      .from(rankingTags)
      .where(
        and(
          eq(rankingTags.rankingKey, rankingKey),
          eq(rankingTags.areaType, areaType)
        )
      );

    return ok(results.map((row) => ({ tagKey: row.tagKey })));
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "getTagsForItem: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
