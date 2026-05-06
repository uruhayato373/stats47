import "server-only";

import { areaProfiles, getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { eq } from "drizzle-orm";

import type { AreaProfileData, StrengthWeaknessItem } from "../types";
import { areaProfileKeyPath } from "../types/snapshot";

export interface ExportAreaProfileSnapshotResult {
  files: number;
  rowCount: number;
  totalSizeBytes: number;
  durationMs: number;
}

/**
 * area_profiles + metrics を area_code 単位で R2 に保存する。
 *
 * 旧: area-profile/all.json (3.8MB, 47都道府県一括)
 * 新: area-profile/{areaCode}.json × 47 (~85KB/file)
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
    .innerJoin(metrics, eq(areaProfiles.metricKey, metrics.key))
    .where(eq(areaProfiles.areaType, "prefecture"));

  const byAreaCode: Record<string, AreaProfileData> = {};
  for (const row of rows) {
    let bucket = byAreaCode[row.areaCode];
    if (!bucket) {
      bucket = { areaCode: row.areaCode, areaName: row.areaName, strengths: [], weaknesses: [] };
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

  let totalSizeBytes = 0;
  const entries = Object.values(byAreaCode);

  await Promise.all(
    entries.map(async (profile) => {
      const body = JSON.stringify(profile);
      const result = await saveToR2(areaProfileKeyPath(profile.areaCode), body, {
        contentType: "application/json; charset=utf-8",
      });
      totalSizeBytes += result.size;
    }),
  );

  const durationMs = Date.now() - startedAt;
  logger.info(
    { files: entries.length, rowCount: rows.length, totalSizeBytes, durationMs },
    "area_profiles snapshot を R2 に保存しました",
  );

  return { files: entries.length, rowCount: rows.length, totalSizeBytes, durationMs };
}
