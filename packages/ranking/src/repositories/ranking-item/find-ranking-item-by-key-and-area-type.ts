import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { parseRankingItemDB } from "../schemas/ranking-items.schemas";
import { rankingItemSelection } from "../shared/ranking-item-selection";

export async function findRankingItemByKeyAndAreaType(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem[], Error>> {
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
      );

    const items = result
      .map((row) => { try { return parseRankingItemDB(row); } catch { return null; } })
      .filter((item): item is RankingItem => item !== null);

    return ok(items);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
