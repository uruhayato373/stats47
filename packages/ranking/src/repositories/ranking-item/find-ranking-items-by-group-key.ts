import "server-only";

import { getDrizzle, metrics, statsPrefecture } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, asc, eq, exists } from "drizzle-orm";

export interface GroupRankingItem {
  rankingKey: string;
  title: string;
  subtitle: string | null;
  unit: string;
  normalizationBasis: string | null;
}

type ValidAreaType = "prefecture" | "city" | "port";

export async function findRankingItemsByGroupKey(
  groupKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<GroupRankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select({
        rankingKey: metrics.key,
        title: metrics.title,
        subtitle: metrics.subtitle,
        unit: metrics.unit,
        normalizationBasis: metrics.normalizationBasis,
      })
      .from(metrics)
      .where(
        and(
          eq(metrics.groupKey, groupKey),
          exists(
            drizzleDb.select({ metricKey: statsPrefecture.metricKey })
              .from(statsPrefecture)
              .where(and(
                eq(statsPrefecture.metricKey, metrics.key),
              ))
          ),
          eq(metrics.isActive, true)
        )
      )
      .orderBy(asc(metrics.featuredOrder));

    return ok(rows);
  } catch (error) {
    logger.error({ groupKey, areaType, error }, "findRankingItemsByGroupKey: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
