import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, asc, desc, eq, like, or } from "drizzle-orm";

import { availableYearsSql, latestYearSql } from "../shared/derive-years-sql";

export interface CategoryRankingItem {
  rankingKey: string;
  title: string;
  subtitle: string | null;
  unit: string;
  latestYear: unknown;
  availableYears: unknown;
  description: string | null;
  demographicAttr: string | null;
  normalizationBasis: string | null;
  groupKey: string | null;
  isFeatured: boolean;
}

export async function findRankingItemsByCategory(
  categoryKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<CategoryRankingItem[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select({
        rankingKey: metrics.key,
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
      .where(
        and(
          or(
            eq(metrics.categoryKey, categoryKey),
            like(metrics.additionalCategoriesJson, `%"${categoryKey}"%`)
          ),
          eq(metrics.isActive, true)
        )
      )
      .orderBy(asc(metrics.featuredOrder), desc(metrics.updatedAt));

    return ok(rows.map((r) => ({ ...r, isFeatured: r.isFeatured ?? false })));
  } catch (error) {
    logger.error({ categoryKey, error }, "findRankingItemsByCategory: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
