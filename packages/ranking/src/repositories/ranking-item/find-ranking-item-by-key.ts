import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { indicatorAsRankingItemSelection } from "../shared/indicator-as-ranking-item-selection";
import { parseIndicatorAsRankingItem } from "../shared/parse-indicator-as-ranking-item";

export async function findRankingItemByKey(
  rankingKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem | null, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select(indicatorAsRankingItemSelection)
      .from(indicators)
      .where(eq(indicators.key, rankingKey))
      .limit(1);

    if (result.length === 0) return ok(null);
    return ok(parseIndicatorAsRankingItem(result[0]));
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
