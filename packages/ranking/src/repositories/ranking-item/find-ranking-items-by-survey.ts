import "server-only";

import {
  getDrizzle,
  rankingItems,
} from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, asc, desc, eq } from "drizzle-orm";

import type { CategoryRankingItem } from "./find-ranking-items-by-category";

export async function findRankingItemsBySurvey(
  surveyId: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<CategoryRankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select({
        rankingKey: rankingItems.rankingKey,
        areaType: rankingItems.areaType,
        title: rankingItems.title,
        subtitle: rankingItems.subtitle,
        unit: rankingItems.unit,
        latestYear: rankingItems.latestYear,
        availableYears: rankingItems.availableYears,
        description: rankingItems.description,
        demographicAttr: rankingItems.demographicAttr,
        normalizationBasis: rankingItems.normalizationBasis,
        isFeatured: rankingItems.isFeatured,
      })
      .from(rankingItems)
      .where(
        and(
          eq(rankingItems.surveyId, surveyId),
          eq(rankingItems.isActive, true)
        )
      )
      .orderBy(asc(rankingItems.featuredOrder), desc(rankingItems.updatedAt));

    return ok(rows.map((r) => ({ ...r, isFeatured: r.isFeatured ?? false })));
  } catch (error) {
    logger.error({ surveyId, error }, "findRankingItemsBySurvey: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
