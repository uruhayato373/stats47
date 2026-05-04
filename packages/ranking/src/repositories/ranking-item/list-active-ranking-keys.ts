import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";

export async function listActiveRankingKeys(
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<{ rankingKey: string; areaType: string }[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .select({ rankingKey: indicators.key, areaType: indicators.areaType })
      .from(indicators)
      .where(and(eq(indicators.areaType, areaType), eq(indicators.isActive, true)));
    return ok(results);
  } catch (error) {
    logger.error({ error, areaType }, "listActiveRankingKeys: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
