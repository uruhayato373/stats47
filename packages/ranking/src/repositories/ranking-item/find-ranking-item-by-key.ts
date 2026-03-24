import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { parseRankingItemDB } from "../schemas/ranking-items.schemas";
import { rankingItemSelection } from "../shared/ranking-item-selection";

export async function findRankingItemByKey(
  rankingKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem | null, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select(rankingItemSelection)
      .from(rankingItems)
      .where(eq(rankingItems.rankingKey, rankingKey))
      .limit(1);

    if (result.length === 0) return ok(null);
    return ok(parseRankingItemDB(result[0]));
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
