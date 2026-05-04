import "server-only";

import { getDrizzle, metrics, observations } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { eq, sql } from "drizzle-orm";

export async function findLatestYear(
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<string | null, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const result = await drizzleDb
      .select({ maxYear: sql<string>`MAX(${observations.yearCode})` })
      .from(observations)
      .innerJoin(metrics, eq(observations.metricId, metrics.id))
      .where(eq(metrics.areaType, areaType));
    return ok(result[0]?.maxYear || null);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
