import "server-only";

import { getDrizzle, statsPrefecture } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { and, desc, eq } from "drizzle-orm";

export async function getAvailableYears(
  rankingKey: string,
  areaType: AreaType,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Array<{ yearCode: string; yearName: string }>, Error>> {
  try {
    const drizzleDb = db ?? getDrizzle();
    const results = await drizzleDb
      .selectDistinct({
        yearCode: statsPrefecture.yearCode,
        yearName: statsPrefecture.yearName,
      })
      .from(statsPrefecture)
      .where(
        and(
          eq(statsPrefecture.metricKey, rankingKey),
        )
      )
      .orderBy(desc(statsPrefecture.yearCode));

    return ok(
      results.map((r) => ({
        yearCode: r.yearCode,
        yearName: r.yearName || `${r.yearCode}年度`,
      }))
    );
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
