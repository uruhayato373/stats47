import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { parseRankingItemDB } from "../schemas/ranking-items.schemas";
import { rankingItemSelection } from "../shared/ranking-item-selection";

export async function listRankingItemsByAreaType(
  areaType: AreaType,
  options?: { dataSourceId?: string; categoryKey?: string },
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const conditions = [eq(rankingItems.areaType, areaType), eq(rankingItems.isActive, true)];
    if (options?.dataSourceId) conditions.push(eq(rankingItems.dataSourceId, options.dataSourceId));
    if (options?.categoryKey) conditions.push(eq(rankingItems.categoryKey, options.categoryKey));

    const result = await drizzleDb
      .select(rankingItemSelection)
      .from(rankingItems)
      .where(and(...conditions))
      .orderBy(rankingItems.title);

    const items = result
      .map((row) => { try { return parseRankingItemDB(row); } catch { return null; } })
      .filter((item): item is RankingItem => item !== null);

    return ok(items);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
