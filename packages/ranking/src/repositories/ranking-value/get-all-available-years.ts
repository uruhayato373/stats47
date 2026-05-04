import "server-only";

import { getDrizzle, metrics, observations } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { desc, eq } from "drizzle-orm";

export async function getAllAvailableYears(
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Array<{ year: string; name: string }>, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .selectDistinct({
        year: observations.yearCode,
        yearName: observations.yearName,
      })
      .from(observations)
      .innerJoin(metrics, eq(observations.metricId, metrics.id))
      .where(eq(metrics.areaType, areaType))
      .orderBy(desc(observations.yearCode));

    return ok(
      results.map((r) => ({
        year: r.year,
        name: r.yearName || `${r.year}年度`,
      }))
    );
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
