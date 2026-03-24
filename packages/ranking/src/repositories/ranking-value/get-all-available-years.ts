import "server-only";

import { getDrizzle, rankingData } from "@stats47/database/server";
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
        year: rankingData.yearCode,
        yearName: rankingData.yearName,
      })
      .from(rankingData)
      .where(eq(rankingData.areaType, areaType))
      .orderBy(desc(rankingData.yearCode));

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
