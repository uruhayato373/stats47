import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { eq } from "drizzle-orm";

import type { Metric } from "@stats47/database/server";

/**
 * metrics を key で取得する reader (area_type は metrics から削除済み)
 */
export async function findMetricByKeyAndAreaType(
  key: string,
  _areaType?: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Metric | null, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select()
      .from(metrics)
      .where(eq(metrics.key, key))
      .limit(1);

    return ok(rows[0] ?? null);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
