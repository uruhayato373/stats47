import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
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
      .select({ rankingKey: metrics.key, areaType: metrics.areaType })
      .from(metrics)
      .where(and(eq(metrics.areaType, areaType), eq(metrics.isActive, true)));
    return ok(results);
  } catch (error) {
    logger.error({ error, areaType }, "listActiveRankingKeys: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
