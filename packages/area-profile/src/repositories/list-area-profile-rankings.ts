import "server-only";

import { and, eq } from "drizzle-orm";

import { areaProfiles, getDrizzle, indicators } from "@stats47/database/server";

/**
 * 指定地域 (prefecture) の生データ行を取得（admin 管理画面用）(PR-5)
 */
export interface AreaProfileRankingRow {
  areaCode: string;
  areaName: string;
  year: string;
  indicator: string;
  rankingKey: string;
  type: string;
  rank: number;
  value: number;
  unit: string;
  percentile: number;
  createdAt: string | null;
}

export async function listAreaProfileRankings(
  areaCode: string
): Promise<AreaProfileRankingRow[]> {
  const db = getDrizzle();

  const rows = await db
    .select({
      entityCode: areaProfiles.entityCode,
      entityName: areaProfiles.entityName,
      yearCode: areaProfiles.yearCode,
      type: areaProfiles.type,
      rank: areaProfiles.rank,
      valueNumeric: areaProfiles.valueNumeric,
      unit: areaProfiles.unit,
      percentile: areaProfiles.percentile,
      createdAt: areaProfiles.createdAt,
      rankingKey: indicators.key,
      indicator: indicators.title,
    })
    .from(areaProfiles)
    .innerJoin(indicators, eq(areaProfiles.indicatorId, indicators.id))
    .where(
      and(
        eq(areaProfiles.entityType, "prefecture"),
        eq(areaProfiles.entityCode, areaCode)
      )
    )
    .orderBy(areaProfiles.type, areaProfiles.rank);

  return rows.map((r) => ({
    areaCode: r.entityCode,
    areaName: r.entityName,
    year: r.yearCode,
    indicator: r.indicator,
    rankingKey: r.rankingKey,
    type: r.type,
    rank: r.rank,
    value: r.valueNumeric,
    unit: r.unit,
    percentile: r.percentile,
    createdAt: r.createdAt,
  }));
}
