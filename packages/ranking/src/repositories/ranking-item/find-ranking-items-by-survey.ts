import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, asc, desc, eq } from "drizzle-orm";

import { availableYearsSql, latestYearSql } from "../shared/derive-years-sql";
import type { CategoryRankingItem } from "./find-ranking-items-by-category";

export async function findRankingItemsBySurvey(
  surveyId: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<CategoryRankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select({
        rankingKey: indicators.key,
        areaType: indicators.areaType,
        title: indicators.title,
        subtitle: indicators.subtitle,
        unit: indicators.unit,
        latestYear: latestYearSql,
        availableYears: availableYearsSql,
        description: indicators.description,
        demographicAttr: indicators.demographicAttr,
        normalizationBasis: indicators.normalizationBasis,
        groupKey: indicators.groupKey,
        isFeatured: indicators.isFeatured,
      })
      .from(indicators)
      .where(and(eq(indicators.surveyId, surveyId), eq(indicators.isActive, true)))
      .orderBy(asc(indicators.featuredOrder), desc(indicators.updatedAt));

    return ok(rows.map((r) => ({ ...r, isFeatured: r.isFeatured ?? false })));
  } catch (error) {
    logger.error({ surveyId, error }, "findRankingItemsBySurvey: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
