import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { metricAsRankingItemSelection } from "../shared/metric-as-ranking-item-selection";
import { parseMetricAsRankingItem } from "../shared/parse-metric-as-ranking-item";

export async function listRankingItemsByAreaType(
  areaType: AreaType,
  options?: { dataSourceId?: string; categoryKey?: string },
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const conditions = [eq(metrics.areaType, areaType), eq(metrics.isActive, true)];
    // dataSourceId は metrics.sourceId に対応するが旧 API と意味が異なる。
    // 後方互換: dataSourceId が "estat" など platform 名なら、sources.parent_source_id で
    // フィルタする必要があるが現状の用途では限定的なので無視する (PR-5 移行措置)。
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
