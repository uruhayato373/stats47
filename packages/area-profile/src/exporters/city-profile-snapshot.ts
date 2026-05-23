import "server-only";

import { eq } from "drizzle-orm";

import { areaProfiles, cities, getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

import type { AreaProfileData, StrengthWeaknessItem } from "../types";

export interface ExportCityProfileSnapshotResult {
  files: number;
  rowCount: number;
  totalSizeBytes: number;
  durationMs: number;
}

/**
 * 市区町村プロファイル R2 キー: app/areas/{prefCode}/cities/{cityCode}/profile.json
 *
 * city pages の URL 構造 (/areas/{prefCode}/cities/{cityCode}) と整合。
 */
export function cityProfileKeyPath(prefectureCode: string, cityCode: string): string {
  return `app/areas/${prefectureCode}/cities/${cityCode}/profile.json`;
}

/**
 * area_profiles (area_type='city') + metrics を city 単位で R2 に保存する。
 *
 * Phase 1 MVP: strengths のみ (weaknesses は無効化中)
 * 保存先: app/areas/{prefCode}/cities/{cityCode}/profile.json
 */
export async function exportCityProfileSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportCityProfileSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  // city profile rows (area_type='city')
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
    .where(eq(areaProfiles.areaType, "city"));

  // city.code → prefecture_code map
  const cityRows = await drizzleDb
    .select({ code: cities.code, prefectureCode: cities.prefectureCode })
    .from(cities);
  const prefByCity: Record<string, string> = {};
  for (const c of cityRows) {
    if (c.prefectureCode) prefByCity[c.code] = c.prefectureCode;
  }

  // group by areaCode
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

  // R2 への並列書き込み (chunk 化で過剰並列を防ぐ)
  const CHUNK = 100;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const slice = entries.slice(i, i + CHUNK);
    await Promise.all(
      slice.map(async (profile) => {
        const prefCode = prefByCity[profile.areaCode];
        if (!prefCode) return; // skip if no prefecture mapping (data integrity issue)
        const body = JSON.stringify(profile);
        const result = await saveToR2(
          cityProfileKeyPath(prefCode, profile.areaCode),
          body,
          { contentType: "application/json; charset=utf-8" }
        );
        totalSizeBytes += result.size;
      }),
    );
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    { files: entries.length, rowCount: rows.length, totalSizeBytes, durationMs },
    "city profile snapshot を R2 に保存しました",
  );

  return { files: entries.length, rowCount: rows.length, totalSizeBytes, durationMs };
}
