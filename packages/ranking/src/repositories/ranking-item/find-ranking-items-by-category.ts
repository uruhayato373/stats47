import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, asc, desc, eq, like, or } from "drizzle-orm";

export interface CategoryRankingItem {
  rankingKey: string;
  areaType: string;
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
        rankingKey: indicators.key,
        areaType: indicators.areaType,
        title: indicators.title,
        subtitle: indicators.subtitle,
        unit: indicators.unit,
        latestYear: indicators.latestYear,
        availableYears: indicators.availableYearsJson,
        description: indicators.description,
        demographicAttr: indicators.demographicAttr,
        normalizationBasis: indicators.normalizationBasis,
        groupKey: indicators.groupKey,
        isFeatured: indicators.isFeatured,
      })
      .from(indicators)
      .where(
        and(
          or(
            eq(indicators.categoryKey, categoryKey),
            like(indicators.additionalCategoriesJson, `%"${categoryKey}"%`)
          ),
          eq(indicators.isActive, true)
        )
      )
      .orderBy(asc(indicators.featuredOrder), desc(indicators.updatedAt));

    return ok(rows.map((r) => ({ ...r, isFeatured: r.isFeatured ?? false })));
  } catch (error) {
    logger.error({ categoryKey, error }, "findRankingItemsByCategory: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
