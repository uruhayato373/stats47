import "server-only";

import { getDrizzle, indicators, indicatorTags } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";

export async function getItemsByTag(
  tagKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Array<{ rankingKey: string; areaType: string }>, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .select({ rankingKey: indicators.key, areaType: indicators.areaType })
      .from(indicatorTags)
      .innerJoin(indicators, eq(indicators.id, indicatorTags.indicatorId))
      .where(
        and(
          eq(indicatorTags.tagKey, tagKey),
          eq(indicators.areaType, areaType)
        )
      );

    return ok(results.map((r) => ({ rankingKey: r.rankingKey, areaType: r.areaType })));
  } catch (error) {
    logger.error({ error, tagKey, areaType }, "getItemsByTag: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
