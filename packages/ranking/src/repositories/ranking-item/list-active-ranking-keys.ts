import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";

export async function listActiveRankingKeys(
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<{ rankingKey: string; areaType: string }[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .select({ rankingKey: rankingItems.rankingKey, areaType: rankingItems.areaType })
      .from(rankingItems)
      .where(
        and(
          eq(rankingItems.areaType, areaType),
          eq(rankingItems.isActive, true)
        )
      );
    return ok(results);
  } catch (error) {
    logger.error({ error, areaType }, "listActiveRankingKeys: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
