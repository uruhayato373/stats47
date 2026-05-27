import "server-only";

import { listMetricKeysByEntity } from "@stats47/data-configs";
import { getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { metricAsRankingItemSelection } from "../shared/metric-as-ranking-item-selection";
import { parseMetricAsRankingItem } from "../shared/parse-metric-as-ranking-item";

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

    if (options?.areaType && options.areaType !== "national") {
      // Phase 7: D1 stats_prefecture EXISTS フィルタを TS-config (`entities`) 由来に置換。
      const allowedKeys = listMetricKeysByEntity(options.areaType);
      if (allowedKeys.length === 0) {
        return ok([]);
      }
      conditions.push(inArray(metrics.key, allowedKeys));
    }
    if (options?.isActive !== undefined) conditions.push(eq(metrics.isActive, options.isActive));

    let query = drizzleDb
      .select(metricAsRankingItemSelection)
      .from(metrics)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(metrics.key))
      .$dynamic();

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.offset(options.offset);

    const result = await query;
    const items = result
      .map((row) => {
        try { return parseMetricAsRankingItem(row); } catch (e) {
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
