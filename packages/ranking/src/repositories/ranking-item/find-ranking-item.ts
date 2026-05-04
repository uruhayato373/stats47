import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { indicatorAsRankingItemSelection } from "../shared/indicator-as-ranking-item-selection";
import { parseIndicatorAsRankingItem } from "../shared/parse-indicator-as-ranking-item";

export async function findRankingItem(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem | null, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select(indicatorAsRankingItemSelection)
      .from(indicators)
      .where(and(eq(indicators.key, rankingKey), eq(indicators.areaType, areaType)))
      .limit(1);

    if (result.length === 0) return ok(null);
    return ok(parseIndicatorAsRankingItem(result[0]));
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "findRankingItem: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
