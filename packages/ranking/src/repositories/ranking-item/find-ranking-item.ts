import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { parseRankingItemDB } from "../schemas/ranking-items.schemas";
import { rankingItemSelection } from "../shared/ranking-item-selection";

export async function findRankingItem(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem | null, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select(rankingItemSelection)
      .from(rankingItems)
      .where(
        and(
          eq(rankingItems.rankingKey, rankingKey),
          eq(rankingItems.areaType, areaType)
        )
      )
      .limit(1);

    if (result.length === 0) return ok(null);
    return ok(parseRankingItemDB(result[0]));
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "findRankingItem: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
