import "server-only";

import { getDrizzle, indicators, taggings } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { and, desc, eq, sql } from "drizzle-orm";

export async function findFirstKeyByTag(
  tagKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<string, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select({ rankingKey: indicators.key })
      .from(indicators)
      .innerJoin(
        taggings,
        eq(taggings.taggableId, sql`CAST(${indicators.id} AS TEXT)`)
      )
      .where(
        and(
          eq(taggings.taggableType, "indicator"),
          eq(taggings.tagKey, tagKey),
          eq(indicators.isActive, true),
          eq(indicators.areaType, "prefecture")
        )
      )
      .orderBy(desc(indicators.updatedAt))
      .limit(1);

    if (result.length === 0) {
      return err(new Error(`First ranking key not found for tagKey: ${tagKey}`));
    }
    return ok(result[0].rankingKey);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
