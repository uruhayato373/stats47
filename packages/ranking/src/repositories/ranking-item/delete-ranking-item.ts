import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";

export async function deleteRankingItem(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<boolean, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    await drizzleDb
      .delete(rankingItems)
      .where(
        and(
          eq(rankingItems.rankingKey, rankingKey),
          eq(rankingItems.areaType, areaType)
        )
      );
    return ok(true);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "deleteRankingItem: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
