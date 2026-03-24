import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, asc, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { parseRankingItemDB } from "../schemas/ranking-items.schemas";
import { rankingItemSelection } from "../shared/ranking-item-selection";

export async function listFeaturedRankingItems(
  limit: number = 20,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select(rankingItemSelection)
      .from(rankingItems)
      .where(
        and(
          eq(rankingItems.isFeatured, true),
          eq(rankingItems.areaType, "prefecture")
        )
      )
      .orderBy(asc(rankingItems.featuredOrder))
      .limit(limit);

    const items = result
      .map((row) => { try { return parseRankingItemDB(row); } catch { return null; } })
      .filter((item): item is RankingItem => item !== null);

    return ok(items);
  } catch (error) {
    logger.error({ error }, "listFeaturedRankingItems: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
