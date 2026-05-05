import "server-only";

import { areaProfiles, getDrizzle } from "@stats47/database/server";
import { eq, sql } from "drizzle-orm";
import type { AreaProfileSummary } from "../types";

/**
 * 都道府県別の集計サマリ (PR-5: 新 area_profiles 経由)
 */
export async function listAreaProfileSummaries(): Promise<AreaProfileSummary[]> {
  const db = getDrizzle();

  const rows = await db
    .select({
      areaCode: areaProfiles.areaCode,
      areaName: areaProfiles.areaName,
      strengthCount: sql<number>`SUM(CASE WHEN ${areaProfiles.type} = 'strength' THEN 1 ELSE 0 END)`,
      weaknessCount: sql<number>`SUM(CASE WHEN ${areaProfiles.type} = 'weakness' THEN 1 ELSE 0 END)`,
    })
    .from(areaProfiles)
    .where(eq(areaProfiles.areaType, "prefecture"))
    .groupBy(areaProfiles.areaCode, areaProfiles.areaName)
    .orderBy(areaProfiles.areaCode);

  return rows.map((r) => ({
    areaCode: r.areaCode,
    areaName: r.areaName,
    strengthCount: Number(r.strengthCount),
    weaknessCount: Number(r.weaknessCount),
  }));
}
