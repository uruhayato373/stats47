import "server-only";

import {
  categories,
  getDrizzle,
  indicators,
  taggings,
} from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { RankingConfigResponse } from "../../types/ranking-config-response";
import { indicatorAsRankingItemSelection } from "../shared/indicator-as-ranking-item-selection";
import { parseIndicatorAsRankingItem } from "../shared/parse-indicator-as-ranking-item";

export async function findRankingItemsByTag(
  tagKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingConfigResponse, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();

    const rows = await drizzleDb
      .select(indicatorAsRankingItemSelection)
      .from(taggings)
      .innerJoin(
        indicators,
        eq(taggings.taggableId, sql`CAST(${indicators.id} AS TEXT)`)
      )
      .where(
        and(
          eq(taggings.taggableType, "indicator"),
          eq(taggings.tagKey, tagKey),
          eq(indicators.isActive, true)
        )
      )
      .orderBy(asc(indicators.featuredOrder), desc(indicators.updatedAt));

    if (rows.length === 0) {
      return err(new Error(`No ranking items found for tagKey: ${tagKey}`));
    }

    const items = rows.map((row) => parseIndicatorAsRankingItem(row));

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
