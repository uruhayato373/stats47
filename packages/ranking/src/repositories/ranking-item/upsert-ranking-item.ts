import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
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
      key: item.rankingKey,
      areaType: item.areaType,
      title: item.title,
      unit: item.unit,
      subtitle: item.subtitle ?? null,
      demographicAttr: item.demographicAttr ?? null,
      normalizationBasis: item.normalizationBasis ?? null,
      description: item.description ?? null,
      additionalCategoriesJson: item.additionalCategories ? JSON.stringify(item.additionalCategories) : null,
      isActive: item.isActive,
      isFeatured: item.isFeatured,
      featuredOrder: item.featuredOrder,
      sourceConfigJson: JSON.stringify(item.sourceConfig),
      valueDisplayConfigJson: JSON.stringify(item.valueDisplay),
      visualizationConfigJson: JSON.stringify(item.visualization),
      calculationConfigJson: JSON.stringify(item.calculation),
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    const drizzleDb = db ?? getDrizzle();
    await drizzleDb
      .insert(metrics)
      .values(dbItem)
      .onConflictDoUpdate({
        target: [metrics.key, metrics.areaType],
        set: {
          title: dbItem.title,
          unit: dbItem.unit,
          subtitle: dbItem.subtitle,
          demographicAttr: dbItem.demographicAttr,
          normalizationBasis: dbItem.normalizationBasis,
          description: dbItem.description,
          sourceConfigJson: dbItem.sourceConfigJson,
          valueDisplayConfigJson: dbItem.valueDisplayConfigJson,
          visualizationConfigJson: dbItem.visualizationConfigJson,
          calculationConfigJson: dbItem.calculationConfigJson,
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
