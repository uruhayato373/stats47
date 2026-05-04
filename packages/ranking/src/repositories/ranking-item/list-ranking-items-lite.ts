import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
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
 * ランキング項目の軽量版リスト（4 列のみ SELECT）
 * 相関分析ページのドロップダウン等、メタデータ不要な場面用。(PR-5: 新 indicators)
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
    if (options?.areaType) conditions.push(eq(indicators.areaType, options.areaType));
    if (options?.isActive !== undefined)
      conditions.push(eq(indicators.isActive, options.isActive));

    const result = await drizzleDb
      .select({
        rankingKey: indicators.key,
        title: indicators.title,
        subtitle: indicators.subtitle,
        unit: indicators.unit,
      })
      .from(indicators)
      .where(and(...conditions))
      .orderBy(asc(indicators.key));

    return ok(result);
  } catch (error) {
    logger.error({ error }, "listRankingItemsLite: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
