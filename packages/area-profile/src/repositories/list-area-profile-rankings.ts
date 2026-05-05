import "server-only";

import { and, eq } from "drizzle-orm";

import { areaProfiles, getDrizzle, metrics } from "@stats47/database/server";

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
      areaCode: areaProfiles.areaCode,
      areaName: areaProfiles.areaName,
      yearCode: areaProfiles.yearCode,
      type: areaProfiles.type,
      rank: areaProfiles.rank,
      value: areaProfiles.value,
      unit: areaProfiles.unit,
      percentile: areaProfiles.percentile,
      createdAt: areaProfiles.createdAt,
      rankingKey: metrics.key,
      indicator: metrics.title,
    })
    .from(areaProfiles)
    .innerJoin(metrics, eq(areaProfiles.metricKey, metrics.key))
    .where(
      and(
        eq(areaProfiles.areaType, "prefecture"),
        eq(areaProfiles.areaCode, areaCode)
      )
    )
    .orderBy(areaProfiles.type, areaProfiles.rank);

  return rows.map((r) => ({
    areaCode: r.areaCode,
    areaName: r.areaName,
    year: r.yearCode,
    indicator: r.indicator,
    rankingKey: r.rankingKey,
    type: r.type,
    rank: r.rank,
    value: r.value,
    unit: r.unit,
    percentile: r.percentile,
    createdAt: r.createdAt,
  }));
}
