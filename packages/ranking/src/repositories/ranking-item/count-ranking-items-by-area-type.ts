import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { count, eq } from "drizzle-orm";

export async function countRankingItemsByAreaType(
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<number, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select({ count: count() })
      .from(rankingItems)
      .where(eq(rankingItems.areaType, areaType));
    return ok(result[0]?.count || 0);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
