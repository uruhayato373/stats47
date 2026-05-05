import "server-only";

import { getDrizzle, metrics, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, asc, eq, exists } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { metricAsRankingItemSelection } from "../shared/metric-as-ranking-item-selection";
import { parseMetricAsRankingItem } from "../shared/parse-metric-as-ranking-item";

type ValidAreaType = "prefecture" | "city" | "port" | "fishing_port";

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
    if (options?.areaType) {
      conditions.push(
        exists(
          drizzleDb.select({ metricKey: observations.metricKey })
            .from(observations)
            .where(and(
              eq(observations.metricKey, metrics.key),
              eq(observations.areaType, options.areaType as ValidAreaType)
            ))
        )
      );
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
