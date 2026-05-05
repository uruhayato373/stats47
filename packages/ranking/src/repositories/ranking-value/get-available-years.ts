import "server-only";

import { getDrizzle, stats } from "@stats47/database/server";
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
        yearCode: stats.yearCode,
        yearName: stats.yearName,
      })
      .from(stats)
      .where(
        and(
          eq(stats.metricKey, rankingKey),
          eq(stats.areaType, areaType as "prefecture" | "city" | "port" | "fishing_port")
        )
      )
      .orderBy(desc(stats.yearCode));

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
