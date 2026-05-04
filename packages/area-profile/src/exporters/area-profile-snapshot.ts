import "server-only";

import { areaProfiles, getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { eq } from "drizzle-orm";

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

/**
 * area_profiles + metrics を JOIN して旧 AreaProfileSnapshot 形式の R2 に出す (PR-5)
 *
 * snapshot の rankingKey / indicator(=title) は frontend reader との後方互換性のため
 * metrics から復元して出力する。
 */
export async function exportAreaProfileSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportAreaProfileSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb
    .select({
      areaCode: areaProfiles.areaCode,
      areaName: areaProfiles.areaName,
      yearCode: areaProfiles.yearCode,
      type: areaProfiles.type,
      rank: areaProfiles.rank,
      value: areaProfiles.value,
      unit: areaProfiles.unit,
      percentile: areaProfiles.percentile,
      rankingKey: metrics.key,
      indicator: metrics.title,
    })
    .from(areaProfiles)
    .innerJoin(metrics, eq(areaProfiles.metricId, metrics.id))
    .where(eq(areaProfiles.areaType, "prefecture"));

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
      year: row.yearCode,
      rank: row.rank,
      value: row.value,
      unit: row.unit,
      percentile: row.percentile,
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
    "area_profiles snapshot を R2 に保存しました",
  );

  return {
    key: result.key,
    areaCount: Object.keys(byAreaCode).length,
    rowCount: rows.length,
    sizeBytes: result.size,
    durationMs,
  };
}
