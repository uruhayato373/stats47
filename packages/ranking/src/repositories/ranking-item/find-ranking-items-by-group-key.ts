import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, asc, eq } from "drizzle-orm";

export interface GroupRankingItem {
  rankingKey: string;
  title: string;
  subtitle: string | null;
  unit: string;
  normalizationBasis: string | null;
}

export async function findRankingItemsByGroupKey(
  groupKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<GroupRankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select({
        rankingKey: indicators.key,
        title: indicators.title,
        subtitle: indicators.subtitle,
        unit: indicators.unit,
        normalizationBasis: indicators.normalizationBasis,
      })
      .from(indicators)
      .where(
        and(
          eq(indicators.groupKey, groupKey),
          eq(indicators.areaType, areaType),
          eq(indicators.isActive, true)
        )
      )
      .orderBy(asc(indicators.featuredOrder));

    return ok(rows);
  } catch (error) {
    logger.error({ groupKey, areaType, error }, "findRankingItemsByGroupKey: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
