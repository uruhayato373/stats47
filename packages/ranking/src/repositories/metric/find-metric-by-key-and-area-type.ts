import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, eq } from "drizzle-orm";

import type { Metric } from "@stats47/database/server";

/**
 * metrics を (key, area_type) で取得する reader
 */
export async function findMetricByKeyAndAreaType(
  key: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Metric | null, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const rows = await drizzleDb
      .select()
      .from(metrics)
      .where(and(eq(metrics.key, key), eq(metrics.areaType, areaType)))
      .limit(1);

    return ok(rows[0] ?? null);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
