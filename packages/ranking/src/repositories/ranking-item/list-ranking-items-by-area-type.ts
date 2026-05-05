import "server-only";

import { getDrizzle, metrics, stats } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq, exists } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { metricAsRankingItemSelection } from "../shared/metric-as-ranking-item-selection";
import { parseMetricAsRankingItem } from "../shared/parse-metric-as-ranking-item";

type ValidAreaType = "prefecture" | "city" | "port" | "fishing_port";

export async function listRankingItemsByAreaType(
  areaType: AreaType,
  options?: { dataSourceId?: string; categoryKey?: string },
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const conditions = [
      exists(
        drizzleDb.select({ metricKey: stats.metricKey })
          .from(stats)
          .where(and(
            eq(stats.metricKey, metrics.key),
            eq(stats.areaType, areaType as ValidAreaType)
          ))
      ),
      eq(metrics.isActive, true),
    ];
    if (options?.categoryKey) conditions.push(eq(metrics.categoryKey, options.categoryKey));

    const result = await drizzleDb
      .select(metricAsRankingItemSelection)
      .from(metrics)
      .where(and(...conditions))
      .orderBy(metrics.title);

    const items = result
      .map((row) => { try { return parseMetricAsRankingItem(row); } catch { return null; } })
      .filter((item): item is RankingItem => item !== null);

    return ok(items);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
