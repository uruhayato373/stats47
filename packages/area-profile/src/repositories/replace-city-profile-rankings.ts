import "server-only";

import { and, eq } from "drizzle-orm";

import { areaProfiles, getDrizzle } from "@stats47/database/server";

export interface CityProfileWriteRow {
  areaCode: string;
  areaName: string;
  year: string;
  indicator: string;
  rankingKey: string;
  type: "strength" | "weakness" | string;
  rank: number;
  value: number;
  unit: string;
  percentile: number;
  createdAt: string;
}

/**
 * 市区町村単位の area_profiles 書き換え。area_type='city' で管理。
 *
 * prefecture batch (replaceAreaProfileRankings) と並走可能。
 * UNIQUE INDEX idx_area_profiles_entity_metric_type が (area_type, area_code, metric_key, type)
 * なので衝突しない。
 */
export async function replaceCityProfileRankings(
  cityCode: string,
  rows: CityProfileWriteRow[]
): Promise<void> {
  const db = getDrizzle();

  await db
    .delete(areaProfiles)
    .where(
      and(
        eq(areaProfiles.areaType, "city"),
        eq(areaProfiles.areaCode, cityCode)
      )
    );

  if (rows.length === 0) return;

  type AreaProfileType = "strength" | "weakness";
  const inserts = rows
    .map((r) => {
      const t: AreaProfileType | null =
        r.type === "strength" ? "strength" : r.type === "weakness" ? "weakness" : null;
      if (!t) return null;
      return {
        areaType: "city" as const,
        areaCode: r.areaCode,
        areaName: r.areaName,
        metricKey: r.rankingKey,
        yearCode: r.year,
        type: t,
        rank: r.rank,
        value: r.value,
        unit: r.unit,
        percentile: r.percentile,
        createdAt: r.createdAt,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const CHUNK_SIZE = 100;
  for (let i = 0; i < inserts.length; i += CHUNK_SIZE) {
    await db.insert(areaProfiles).values(inserts.slice(i, i + CHUNK_SIZE));
  }
}
