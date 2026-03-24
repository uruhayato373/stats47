import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { sql } from "drizzle-orm";
import type { RankingItem } from "../../types";

export async function upsertRankingItem(
  item: RankingItem,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<void, Error>> {
  try {
    const dbItem = {
      rankingKey: item.rankingKey,
      areaType: item.areaType,
      title: item.title,
      rankingName: item.rankingName,
      unit: item.unit,
      subtitle: item.subtitle ?? null,
      demographicAttr: item.demographicAttr ?? null,
      normalizationBasis: item.normalizationBasis ?? null,
      description: item.description ?? null,
      additionalCategories: item.additionalCategories ? JSON.stringify(item.additionalCategories) : null,
      isActive: item.isActive,
      isFeatured: item.isFeatured,
      featuredOrder: item.featuredOrder,
      dataSourceId: item.dataSourceId,
      sourceConfig: JSON.stringify(item.sourceConfig),
      valueDisplayConfig: JSON.stringify(item.valueDisplay),
      visualizationConfig: JSON.stringify(item.visualization),
      calculationConfig: JSON.stringify(item.calculation),
      latestYear: item.latestYear ? JSON.stringify(item.latestYear) : null,
      availableYears: item.availableYears ? JSON.stringify(item.availableYears) : null,
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    const drizzleDb = db ?? getDrizzle();
    await drizzleDb
      .insert(rankingItems)
      .values(dbItem)
      .onConflictDoUpdate({
        target: [rankingItems.rankingKey, rankingItems.areaType],
        set: {
          title: dbItem.title,
          rankingName: dbItem.rankingName,
          unit: dbItem.unit,
          subtitle: dbItem.subtitle,
          demographicAttr: dbItem.demographicAttr,
          normalizationBasis: dbItem.normalizationBasis,
          description: dbItem.description,
          dataSourceId: dbItem.dataSourceId,
          sourceConfig: dbItem.sourceConfig,
          valueDisplayConfig: dbItem.valueDisplayConfig,
          visualizationConfig: dbItem.visualizationConfig,
          calculationConfig: dbItem.calculationConfig,
          latestYear: dbItem.latestYear,
          availableYears: dbItem.availableYears,
          updatedAt: sql`CURRENT_TIMESTAMP`,
          isFeatured: dbItem.isFeatured,
          isActive: dbItem.isActive,
        },
      });

    return ok(undefined);
  } catch (error) {
    logger.error({ error, rankingKey: item.rankingKey }, "upsertRankingItem: failed");
    return err(error instanceof Error ? error : new Error("Failed to upsert ranking item"));
  }
}
