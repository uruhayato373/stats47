import "server-only";

import { areaProfileRankings, getDrizzle } from "@stats47/database/server";
import { saveJsonSnapshot } from "@stats47/r2-storage/server";

import type { AreaProfileData, StrengthWeaknessItem } from "../types";
import {
  AREA_PROFILE_SNAPSHOT_KEY,
  type AreaProfileSnapshot,
} from "../types/snapshot";

import type { JsonSnapshotResult } from "@stats47/r2-storage/server";

export interface ExportAreaProfileSnapshotResult extends JsonSnapshotResult {
  areaCount: number;
  rowCount: number;
}

export async function exportAreaProfileSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportAreaProfileSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb.select().from(areaProfileRankings);

  const byAreaCode: Record<string, AreaProfileData> = {};
  for (const row of rows) {
    let bucket = byAreaCode[row.areaCode];
    if (!bucket) {
      bucket = {
        areaCode: row.areaCode,
        areaName: row.areaName,
        strengths: [],
        weaknesses: [],
      };
      byAreaCode[row.areaCode] = bucket;
    }
    const item: StrengthWeaknessItem = {
      indicator: row.indicator,
      rankingKey: row.rankingKey,
      year: row.year,
      rank: row.rank,
      value: row.value,
      unit: row.unit,
      percentile: row.percentile ?? undefined,
    };
    if (row.type === "strength") bucket.strengths.push(item);
    else if (row.type === "weakness") bucket.weaknesses.push(item);
  }

  for (const profile of Object.values(byAreaCode)) {
    profile.strengths.sort((a, b) => a.rank - b.rank);
    profile.weaknesses.sort((a, b) => b.rank - a.rank);
  }

  const snapshot: AreaProfileSnapshot = {
    generatedAt: new Date().toISOString(),
    byAreaCode,
  };

  const result = await saveJsonSnapshot({
    key: AREA_PROFILE_SNAPSHOT_KEY,
    data: snapshot,
    count: rows.length,
    label: "area-profile",
    startedAt,
  });

  return {
    ...result,
    areaCount: Object.keys(byAreaCode).length,
    rowCount: rows.length,
  };
}
