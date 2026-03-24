import "server-only";

import { areaProfileRankings, getDrizzle } from "@stats47/database/server";
import { sql } from "drizzle-orm";
import type { AreaProfileSummary } from "../types";

/**
 * 都道府県別の集計サマリを取得
 */
export async function listAreaProfileSummaries(): Promise<AreaProfileSummary[]> {
  const db = getDrizzle();

  const rows = await db
    .select({
      areaCode: areaProfileRankings.areaCode,
      areaName: areaProfileRankings.areaName,
      strengthCount: sql<number>`SUM(CASE WHEN ${areaProfileRankings.type} = 'strength' THEN 1 ELSE 0 END)`,
      weaknessCount: sql<number>`SUM(CASE WHEN ${areaProfileRankings.type} = 'weakness' THEN 1 ELSE 0 END)`,
    })
    .from(areaProfileRankings)
    .groupBy(
      areaProfileRankings.areaCode,
      areaProfileRankings.areaName,
    )
    .orderBy(areaProfileRankings.areaCode)
    .all();

  return rows.map((r) => ({
    areaCode: r.areaCode,
    areaName: r.areaName,
    strengthCount: Number(r.strengthCount),
    weaknessCount: Number(r.weaknessCount),
  }));
}
