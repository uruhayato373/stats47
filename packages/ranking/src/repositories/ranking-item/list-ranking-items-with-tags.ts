import "server-only";

import { getDrizzle, indicatorTags, indicators } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { eq } from "drizzle-orm";
import type { RankingItemWithTags } from "../../types/ranking-item-with-tags";
import { listRankingItems } from "./list-ranking-items";

export async function listRankingItemsWithTags(
  options?: { areaType?: AreaType; isActive?: boolean },
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItemWithTags[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const itemsResult = await listRankingItems(options, drizzleDb);
    if (!itemsResult.success) return itemsResult;

    const items = itemsResult.data;
    if (items.length === 0) return ok([]);

    // 新 indicator_tags を indicators と JOIN して旧 (rankingKey, areaType) → tagKey を復元
    const allTags = await drizzleDb
      .select({
        rankingKey: indicators.key,
        areaType: indicators.areaType,
        tagKey: indicatorTags.tagKey,
      })
      .from(indicatorTags)
      .innerJoin(indicators, eq(indicatorTags.indicatorId, indicators.id));

    const itemsWithTags = items.map((item) => {
      const itemTags = allTags
        .filter((t) => t.rankingKey === item.rankingKey && t.areaType === item.areaType)
        .map((t) => ({ tagKey: t.tagKey }));
      return { ...item, tags: itemTags };
    });

    return ok(itemsWithTags);
  } catch (error) {
    logger.error({ error }, "listRankingItemsWithTags: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
