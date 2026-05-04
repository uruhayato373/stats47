import "server-only";

import { getDrizzle, indicators, indicatorTags } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { and, eq } from "drizzle-orm";

export async function syncRankingTags(
  rankingKey: string,
  areaType: string,
  tagKeys: string[],
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<boolean, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();

    const indicatorRow = await drizzleDb
      .select({ id: indicators.id })
      .from(indicators)
      .where(
        and(
          eq(indicators.key, rankingKey),
          eq(
            indicators.areaType,
            areaType as "prefecture" | "city" | "national" | "port" | "fishing_port"
          )
        )
      )
      .limit(1);

    if (indicatorRow.length === 0) {
      return err(
        new Error(`indicator not found: key=${rankingKey} areaType=${areaType}`)
      );
    }
    const indicatorId = indicatorRow[0].id;

    await drizzleDb
      .delete(indicatorTags)
      .where(eq(indicatorTags.indicatorId, indicatorId));

    if (tagKeys.length > 0) {
      await drizzleDb.insert(indicatorTags).values(
        tagKeys.map((tagKey) => ({
          indicatorId,
          tagKey,
          createdAt: new Date().toISOString(),
        }))
      );
    }

    return ok(true);
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "syncRankingTags: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
