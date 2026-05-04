import "server-only";

import { getDrizzle, indicators } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";

export async function deleteAllRankingItems(
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<number, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb.delete(indicators).returning();
    return ok(result.length);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
