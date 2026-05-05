import "server-only";

import { getDrizzle, metrics, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, asc, eq, exists } from "drizzle-orm";

export interface RankingItemLite {
  rankingKey: string;
  title: string;
  subtitle: string | null;
  unit: string;
}

type ValidAreaType = "prefecture" | "city" | "port" | "fishing_port";

/**
 * ランキング項目の軽量版リスト（4 列のみ SELECT）
 * 相関分析ページのドロップダウン等、メタデータ不要な場面用。(PR-5: 新 metrics)
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
    if (options?.isActive !== undefined)
      conditions.push(eq(metrics.isActive, options.isActive));

    const result = await drizzleDb
      .select({
        rankingKey: metrics.key,
        title: metrics.title,
        subtitle: metrics.subtitle,
        unit: metrics.unit,
      })
      .from(metrics)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(metrics.key));

    return ok(result);
  } catch (error) {
    logger.error({ error }, "listRankingItemsLite: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
