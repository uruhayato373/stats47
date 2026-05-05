import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
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

    const tagRows = await drizzleDb
      .select({ key: metrics.key, tags: metrics.tags })
      .from(metrics);

    const tagsByKey = new Map(tagRows.map((r) => [r.key, r.tags]));

    const itemsWithTags = items.map((item) => {
      const tagsJson = tagsByKey.get(item.rankingKey) ?? "[]";
      const tagKeys = JSON.parse(tagsJson) as string[];
      return { ...item, tags: tagKeys.map((tagKey) => ({ tagKey })) };
    });

    return ok(itemsWithTags);
  } catch (error) {
    logger.error({ error }, "listRankingItemsWithTags: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
