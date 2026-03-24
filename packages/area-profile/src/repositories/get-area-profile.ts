import "server-only";

import { areaProfileRankings, getDrizzle } from "@stats47/database/server";
import { asc, eq } from "drizzle-orm";
import type { AreaProfileData, StrengthWeaknessItem } from "../types";

/**
 * 指定地域コードのプロファイルデータを取得する
 */
export async function getAreaProfileByCode(
  areaCode: string
): Promise<AreaProfileData | null> {
  const db = getDrizzle();

  const rows = await db
    .select()
    .from(areaProfileRankings)
    .where(eq(areaProfileRankings.areaCode, areaCode))
    .orderBy(asc(areaProfileRankings.rank));

  if (rows.length === 0) return null;

  const toItem = (row: (typeof rows)[0]): StrengthWeaknessItem => ({
    indicator: row.indicator,
    rankingKey: row.rankingKey,
    year: row.year,
    rank: row.rank,
    value: row.value,
    unit: row.unit,
    percentile: row.percentile ?? undefined,
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
    areaName: rows[0].areaName,
    strengths,
    weaknesses,
  };
}
