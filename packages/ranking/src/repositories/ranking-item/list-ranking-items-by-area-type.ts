import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";
import type { RankingItem } from "../../types";
import { indicatorAsRankingItemSelection } from "../shared/indicator-as-ranking-item-selection";
import { parseIndicatorAsRankingItem } from "../shared/parse-indicator-as-ranking-item";

export async function listRankingItemsByAreaType(
  areaType: AreaType,
  options?: { dataSourceId?: string; categoryKey?: string },
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<RankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const conditions = [eq(indicators.areaType, areaType), eq(indicators.isActive, true)];
    // dataSourceId は indicators.sourceId に対応するが旧 API と意味が異なる。
    // 後方互換: dataSourceId が "estat" など platform 名なら、sources.parent_source_id で
    // フィルタする必要があるが現状の用途では限定的なので無視する (PR-5 移行措置)。
    if (options?.categoryKey) conditions.push(eq(indicators.categoryKey, options.categoryKey));

    const result = await drizzleDb
      .select(indicatorAsRankingItemSelection)
      .from(indicators)
      .where(and(...conditions))
      .orderBy(indicators.title);

    const items = result
      .map((row) => { try { return parseIndicatorAsRankingItem(row); } catch { return null; } })
      .filter((item): item is RankingItem => item !== null);

    return ok(items);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
