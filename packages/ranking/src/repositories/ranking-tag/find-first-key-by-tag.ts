import "server-only";

import { getDrizzle, rankingItems, rankingTags } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { and, desc, eq } from "drizzle-orm";

export async function findFirstKeyByTag(
  tagKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<string, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select({ rankingKey: rankingItems.rankingKey })
      .from(rankingItems)
      .innerJoin(
        rankingTags,
        and(
          eq(rankingItems.rankingKey, rankingTags.rankingKey),
          eq(rankingItems.areaType, rankingTags.areaType)
        )
      )
      .where(
        and(
          eq(rankingTags.tagKey, tagKey),
          eq(rankingItems.isActive, true),
          eq(rankingItems.areaType, "prefecture")
        )
      )
      .orderBy(desc(rankingItems.updatedAt))
      .limit(1);

    if (result.length === 0) {
      return err(new Error(`First ranking key not found for tagKey: ${tagKey}`));
    }
    return ok(result[0].rankingKey);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
