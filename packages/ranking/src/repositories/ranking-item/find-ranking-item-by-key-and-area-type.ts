import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { metricAsRankingItemSelection } from "../shared/metric-as-ranking-item-selection";
import { parseMetricAsRankingItem } from "../shared/parse-metric-as-ranking-item";

export async function findRankingItemByKeyAndAreaType(
  rankingKey: string,
  _areaType?: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select(metricAsRankingItemSelection)
      .from(metrics)
      .where(eq(metrics.key, rankingKey));

    const items = result
      .map((row) => { try { return parseMetricAsRankingItem(row); } catch { return null; } })
      .filter((item): item is RankingItem => item !== null);

    return ok(items);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
