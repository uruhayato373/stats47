import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, asc, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { indicatorAsRankingItemSelection } from "../shared/indicator-as-ranking-item-selection";
import { parseIndicatorAsRankingItem } from "../shared/parse-indicator-as-ranking-item";

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
    if (options?.areaType) conditions.push(eq(indicators.areaType, options.areaType));
    if (options?.isActive !== undefined) conditions.push(eq(indicators.isActive, options.isActive));

    let query = drizzleDb
      .select(indicatorAsRankingItemSelection)
      .from(indicators)
      .where(and(...conditions))
      .orderBy(asc(indicators.key))
      .$dynamic();

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.offset(options.offset);

    const result = await query;
    const items = result
      .map((row) => {
        try { return parseIndicatorAsRankingItem(row); } catch (e) {
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
