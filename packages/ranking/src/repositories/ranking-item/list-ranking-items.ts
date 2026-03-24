import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, asc, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { parseRankingItemDB } from "../schemas/ranking-items.schemas";
import { rankingItemSelection } from "../shared/ranking-item-selection";

export async function listRankingItems(
  options?: {
    areaType?: AreaType;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  },
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const conditions = [];
    if (options?.areaType) conditions.push(eq(rankingItems.areaType, options.areaType));
    if (options?.isActive !== undefined) conditions.push(eq(rankingItems.isActive, options.isActive));

    let query = drizzleDb
      .select(rankingItemSelection)
      .from(rankingItems)
      .where(and(...conditions))
      .orderBy(asc(rankingItems.rankingKey))
      .$dynamic();

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.offset(options.offset);

    const result = await query;
    const items = result
      .map((row) => {
        try { return parseRankingItemDB(row); } catch (e) {
          logger.warn({ error: e }, "listRankingItems: failed to parse item");
          return null;
        }
      })
      .filter((item): item is RankingItem => item !== null);

    return ok(items);
  } catch (error) {
    logger.error({ error }, "listRankingItems: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
