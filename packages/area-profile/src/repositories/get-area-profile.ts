import "server-only";

import { areaProfiles, getDrizzle, metrics } from "@stats47/database/server";
import { and, asc, eq } from "drizzle-orm";
import type { AreaProfileData, StrengthWeaknessItem } from "../types";

/**
 * 指定地域のプロフィールを取得 (PR-5: 新 area_profiles 経由)
 */
export async function getAreaProfileByCode(
  areaCode: string
): Promise<AreaProfileData | null> {
  const db = getDrizzle();

  const rows = await db
    .select({
      entityName: areaProfiles.entityName,
      yearCode: areaProfiles.yearCode,
      type: areaProfiles.type,
      rank: areaProfiles.rank,
      valueNumeric: areaProfiles.valueNumeric,
      unit: areaProfiles.unit,
      percentile: areaProfiles.percentile,
      rankingKey: metrics.key,
      indicator: metrics.title,
    })
    .from(areaProfiles)
    .innerJoin(metrics, eq(areaProfiles.metricId, metrics.id))
    .where(
      and(
        eq(areaProfiles.entityType, "prefecture"),
        eq(areaProfiles.entityCode, areaCode)
      )
    )
    .orderBy(asc(areaProfiles.rank));

  if (rows.length === 0) return null;

  const toItem = (row: (typeof rows)[0]): StrengthWeaknessItem => ({
    indicator: row.indicator,
    rankingKey: row.rankingKey,
    year: row.yearCode,
    rank: row.rank,
    value: row.valueNumeric,
    unit: row.unit,
    percentile: row.percentile,
  });

  const strengths = rows
    .filter((r) => r.type === "strength")
    .sort((a, b) => a.rank - b.rank)
    .map(toItem);

  const weaknesses = rows
    .filter((r) => r.type === "weakness")
    .sort((a, b) => b.rank - a.rank)
    .map(toItem);

  return {
    areaCode,
    areaName: rows[0].entityName,
    strengths,
    weaknesses,
  };
}
