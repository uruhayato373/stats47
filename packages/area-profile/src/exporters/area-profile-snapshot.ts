import "server-only";

import { areaProfileRankings, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

import type { AreaProfileData, StrengthWeaknessItem } from "../types";
import {
  AREA_PROFILE_SNAPSHOT_KEY,
  type AreaProfileSnapshot,
} from "../types/snapshot";

export interface ExportAreaProfileSnapshotResult {
  key: string;
  areaCount: number;
  rowCount: number;
  sizeBytes: number;
  durationMs: number;
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

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(AREA_PROFILE_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      key: result.key,
      areaCount: Object.keys(byAreaCode).length,
      rowCount: rows.length,
      sizeBytes: result.size,
      durationMs,
    },
    "area-profile snapshot を R2 に保存しました",
  );

  return {
    key: result.key,
    areaCount: Object.keys(byAreaCode).length,
    rowCount: rows.length,
    sizeBytes: result.size,
    durationMs,
  };
}
