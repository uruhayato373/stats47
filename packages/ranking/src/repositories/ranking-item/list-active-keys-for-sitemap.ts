import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { eq } from "drizzle-orm";

export async function listActiveKeysForSitemap(
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<{ rankingKey: string; updatedAt: string | null }[], Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .select({ rankingKey: metrics.key, updatedAt: metrics.updatedAt })
      .from(metrics)
      .where(eq(metrics.isActive, true));
    return ok(results);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
