import "server-only";

import {
  categories,
  getDrizzle,
  rankingItems,
  rankingTags,
} from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, asc, desc, eq } from "drizzle-orm";
import type { RankingConfigResponse } from "../../types/ranking-config-response";
import {
  parseRankingItemDB,
} from "../schemas/ranking-items.schemas";
import { rankingItemSelection } from "../shared/ranking-item-selection";

export async function findRankingItemsByTag(
  tagKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingConfigResponse, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();

    // Find ranking items with this tag
    const rows = await drizzleDb
      .select(rankingItemSelection)
      .from(rankingTags)
      .innerJoin(
        rankingItems,
        and(
          eq(rankingTags.rankingKey, rankingItems.rankingKey),
          eq(rankingTags.areaType, rankingItems.areaType)
        )
      )
      .where(
        and(
          eq(rankingTags.tagKey, tagKey),
          eq(rankingItems.isActive, true)
        )
      )
      .orderBy(asc(rankingItems.featuredOrder), desc(rankingItems.updatedAt));

    if (rows.length === 0) {
      return err(new Error(`No ranking items found for tagKey: ${tagKey}`));
    }

    const items = rows.map((row) => parseRankingItemDB(row));

    // Get category info from the first item
    const firstItem = items[0];
    let categoryName = firstItem.categoryKey ?? "";
    if (firstItem.categoryKey) {
      const catResult = await drizzleDb
        .select({ categoryName: categories.categoryName })
        .from(categories)
        .where(eq(categories.categoryKey, firstItem.categoryKey))
        .limit(1);
      if (catResult.length > 0) {
        categoryName = catResult[0].categoryName;
      }
    }

    return ok({
      category: {
        categoryKey: firstItem.categoryKey ?? "",
        categoryName,
        defaultRankingKey: firstItem.rankingKey,
      },
      rankingItems: items,
    });
  } catch (error) {
    logger.error({ tagKey, error }, "findRankingItemsByTag: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
