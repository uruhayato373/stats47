import "server-only";

import { and, eq } from "drizzle-orm";

import { areaProfiles, getDrizzle } from "@stats47/database/server";

export interface AreaProfileWriteRow {
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

export async function replaceAreaProfileRankings(
  areaCode: string,
  rows: AreaProfileWriteRow[]
): Promise<void> {
  const db = getDrizzle();

  await db
    .delete(areaProfiles)
    .where(
      and(
        eq(areaProfiles.areaType, "prefecture"),
        eq(areaProfiles.areaCode, areaCode)
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
        areaType: "prefecture" as const,
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
