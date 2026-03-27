import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, asc, eq } from "drizzle-orm";

export interface RankingItemLite {
  rankingKey: string;
  title: string;
  subtitle: string | null;
  unit: string;
}

/**
 * ランキング項目の軽量版リスト（4列のみ SELECT）
 * 相関分析ページのドロップダウン等、メタデータ不要な場面用。
 */
export async function listRankingItemsLite(
  options?: {
    areaType?: AreaType;
    isActive?: boolean;
  },
  db?: ReturnType<typeof getDrizzle>,
): Promise<Result<RankingItemLite[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const conditions = [];
    if (options?.areaType)
      conditions.push(eq(rankingItems.areaType, options.areaType));
    if (options?.isActive !== undefined)
      conditions.push(eq(rankingItems.isActive, options.isActive));

    const result = await drizzleDb
      .select({
        rankingKey: rankingItems.rankingKey,
        title: rankingItems.title,
        subtitle: rankingItems.subtitle,
        unit: rankingItems.unit,
      })
      .from(rankingItems)
      .where(and(...conditions))
      .orderBy(asc(rankingItems.rankingKey));

    return ok(result);
  } catch (error) {
    logger.error({ error }, "listRankingItemsLite: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
