import "server-only";

import {
  getDrizzle,
  rankingItems,
} from "@stats47/database/server";
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
        rankingKey: rankingItems.rankingKey,
        title: rankingItems.title,
        subtitle: rankingItems.subtitle,
        unit: rankingItems.unit,
        normalizationBasis: rankingItems.normalizationBasis,
      })
      .from(rankingItems)
      .where(
        and(
          eq(rankingItems.groupKey, groupKey),
          eq(rankingItems.areaType, areaType),
          eq(rankingItems.isActive, true)
        )
      )
      .orderBy(asc(rankingItems.featuredOrder));

    return ok(rows);
  } catch (error) {
    logger.error({ groupKey, areaType, error }, "findRankingItemsByGroupKey: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
