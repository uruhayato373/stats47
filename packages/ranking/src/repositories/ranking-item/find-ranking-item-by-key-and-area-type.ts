import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { indicatorAsRankingItemSelection } from "../shared/indicator-as-ranking-item-selection";
import { parseIndicatorAsRankingItem } from "../shared/parse-indicator-as-ranking-item";

export async function findRankingItemByKeyAndAreaType(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select(indicatorAsRankingItemSelection)
      .from(indicators)
      .where(and(eq(indicators.key, rankingKey), eq(indicators.areaType, areaType)));

    const items = result
      .map((row) => { try { return parseIndicatorAsRankingItem(row); } catch { return null; } })
      .filter((item): item is RankingItem => item !== null);

    return ok(items);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
