import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
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
        rankingKey: metrics.key,
        areaType: metrics.areaType,
        title: metrics.title,
        subtitle: metrics.subtitle,
        unit: metrics.unit,
        latestYear: latestYearSql,
        availableYears: availableYearsSql,
        description: metrics.description,
        demographicAttr: metrics.demographicAttr,
        normalizationBasis: metrics.normalizationBasis,
        groupKey: metrics.groupKey,
        isFeatured: metrics.isFeatured,
      })
      .from(metrics)
      .where(and(eq(metrics.surveyId, surveyId), eq(metrics.isActive, true)))
      .orderBy(asc(metrics.featuredOrder), desc(metrics.updatedAt));

    return ok(rows.map((r) => ({ ...r, isFeatured: r.isFeatured ?? false })));
  } catch (error) {
    logger.error({ surveyId, error }, "findRankingItemsBySurvey: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
