import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { eq } from "drizzle-orm";

export async function getTagsForItem(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Array<{ tagKey: string }>, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select({ tags: metrics.tags })
      .from(metrics)
      .where(eq(metrics.key, rankingKey))
      .limit(1);

    const tagKeys = JSON.parse(rows[0]?.tags ?? "[]") as string[];
    return ok(tagKeys.map((tagKey) => ({ tagKey })));
  } catch (error) {
    logger.error({ error, rankingKey, areaType }, "getTagsForItem: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
