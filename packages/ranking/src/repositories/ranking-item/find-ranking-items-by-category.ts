import "server-only";

import {
  getDrizzle,
  rankingItems,
} from "@stats47/database/server";
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
        groupKey: rankingItems.groupKey,
        isFeatured: rankingItems.isFeatured,
      })
      .from(rankingItems)
      .where(
        and(
          or(
            eq(rankingItems.categoryKey, categoryKey),
            like(rankingItems.additionalCategories, `%"${categoryKey}"%`)
          ),
          eq(rankingItems.isActive, true)
        )
      )
      .orderBy(asc(rankingItems.featuredOrder), desc(rankingItems.updatedAt));

    return ok(rows.map((r) => ({ ...r, isFeatured: r.isFeatured ?? false })));
  } catch (error) {
    logger.error({ categoryKey, error }, "findRankingItemsByCategory: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
