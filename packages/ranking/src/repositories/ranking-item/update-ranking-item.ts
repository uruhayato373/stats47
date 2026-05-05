import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { eq, sql } from "drizzle-orm";
import type { RankingItem } from "../../types";

export async function updateRankingItem(
  rankingKey: string,
  _areaType: string,
  updates: Partial<RankingItem>,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<boolean, Error>> {
  try {
    logger.debug(
      { rankingKey, updatedFields: Object.keys(updates) },
      "updateRankingItem: start"
    );

    const mappedUpdates: Record<string, unknown> = {};

    if (updates.title !== undefined) mappedUpdates.title = updates.title;
    if (updates.rankingName !== undefined && updates.title === undefined) {
      mappedUpdates.title = updates.rankingName;
    }
    if (updates.unit !== undefined) mappedUpdates.unit = updates.unit;
    if (updates.subtitle !== undefined) mappedUpdates.subtitle = updates.subtitle ?? null;
    if (updates.description !== undefined) mappedUpdates.description = updates.description ?? null;
    if (updates.demographicAttr !== undefined) mappedUpdates.demographicAttr = updates.demographicAttr ?? null;
    if (updates.normalizationBasis !== undefined) mappedUpdates.normalizationBasis = updates.normalizationBasis ?? null;
    if (updates.categoryKey !== undefined) mappedUpdates.categoryKey = updates.categoryKey ?? null;
    if (updates.isActive !== undefined) mappedUpdates.isActive = updates.isActive;
    if (updates.isFeatured !== undefined) mappedUpdates.isFeatured = updates.isFeatured;
    if (updates.featuredOrder !== undefined) mappedUpdates.featuredOrder = updates.featuredOrder;
    if (updates.sourceConfig !== undefined) mappedUpdates.sourceConfigJson = JSON.stringify(updates.sourceConfig);
    if (updates.valueDisplay !== undefined) mappedUpdates.valueDisplayConfigJson = JSON.stringify(updates.valueDisplay);
    if (updates.visualization !== undefined) mappedUpdates.visualizationConfigJson = JSON.stringify(updates.visualization);
    if (updates.calculation !== undefined) mappedUpdates.calculationConfigJson = JSON.stringify(updates.calculation);

    if (Object.keys(mappedUpdates).length === 0) {
      return err(new Error("No fields to update"));
    }

    mappedUpdates.updatedAt = sql`CURRENT_TIMESTAMP`;

    const drizzleDb = db ?? getDrizzle();
    await drizzleDb
      .update(metrics)
      .set(mappedUpdates)
      .where(eq(metrics.key, rankingKey));

    return ok(true);
  } catch (error) {
    logger.error({ error, rankingKey }, "updateRankingItem: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
