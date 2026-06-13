import "server-only";

import { getMetricConfig, getMetricMeta, listMetricKeysByEntity } from "@stats47/data-configs";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { readStatsValues } from "@stats47/stats-r2/readers";
import type { SingleEntityRow } from "@stats47/stats-r2/types";

import { buildCityProfileRows, type CityRankingData } from "../utils/build-city-profile-rows";
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

const CHUNK = 100;

/**
 * 市区町村プロファイル (県内 top5 = 強み) を R2 に保存する。
 *
 * 完全DBレス (docs/01_技術設計/12_完全DBレス設計.md): 削除済の run-batch-city.ts (D1 area_profiles
 * 書込) と D1 読みの旧 exporter を置換し、R2 から直接計算する:
 *   - city metric = git TS `listMetricKeysByEntity("city")` (active のみ)
 *   - 観測値      = R2 `app/stats/<metric>/cities.json` (各行に prefectureCode + 全国 rank)
 *   - rankPref    = metric×最新年ごとに prefectureCode で group → 全国 rank 昇順で県内連番付与
 *   - 強み判定    = buildCityProfileRows (既存 pure util・県内 top5・percentile 57近似、不変)
 *
 * 出力 (AreaProfileData / profile.json) は旧 D1 版と同一構造。weaknesses は Phase 1 MVP 通り空。
 */
export async function exportCityProfileSnapshot(): Promise<ExportCityProfileSnapshotResult> {
  const startedAt = Date.now();

  const cityMetricKeys = listMetricKeysByEntity("city").filter(
    (key) => getMetricConfig(key)?.isActive !== false,
  );

  const now = new Date().toISOString();
  // cityCode -> CityRankingData[]  /  cityCode -> prefectureCode
  const cityDataMap = new Map<string, CityRankingData[]>();
  const prefByCity = new Map<string, string>();

  let metricsRead = 0;
  for (const key of cityMetricKeys) {
    const payload = await readStatsValues(key, "city");
    const rows = payload?.rows;
    if (!rows || rows.length === 0) continue;

    // 最新年を決定 (git TS の latestYear を優先、無ければ cities.json の最大 yearCode)
    const meta = getMetricMeta(key);
    let latestYearCode = meta?.latestYear?.yearCode;
    let yearName = meta?.latestYear?.yearName;
    if (!latestYearCode) {
      latestYearCode = rows.reduce((m, r) => (r.yearCode > m ? r.yearCode : m), "");
      yearName = `${latestYearCode}年度`;
    }

    // 県内順位の再構築に必要な行のみ: 最新年・値あり・全国 rank あり・prefectureCode あり
    const yearRows = rows.filter(
      (r) =>
        r.yearCode === latestYearCode &&
        r.value != null &&
        r.rank != null &&
        !!r.prefectureCode,
    );
    if (yearRows.length === 0) continue;
    metricsRead++;

    const indicator = getMetricConfig(key)?.title ?? key;

    // rankPref 再構築: prefectureCode で group → 全国 rank 昇順で県内連番
    const byPref = new Map<string, SingleEntityRow[]>();
    for (const r of yearRows) {
      const list = byPref.get(r.prefectureCode as string) ?? [];
      list.push(r);
      byPref.set(r.prefectureCode as string, list);
    }
    for (const group of byPref.values()) {
      group.sort((a, b) => (a.rank as number) - (b.rank as number));
      group.forEach((r, i) => {
        const list = cityDataMap.get(r.areaCode) ?? [];
        list.push({
          rankingKey: key,
          indicator,
          year: yearName ?? `${latestYearCode}年度`,
          rankPref: i + 1,
          rankNational: r.rank as number,
          value: r.value as number,
          unit: r.unit ?? "",
          areaName: r.areaName,
        });
        cityDataMap.set(r.areaCode, list);
        prefByCity.set(r.areaCode, r.prefectureCode as string);
      });
    }
  }

  logger.info(
    { cityMetrics: cityMetricKeys.length, metricsRead, cities: cityDataMap.size },
    "city profile: R2 cities.json を集約完了",
  );

  let totalSizeBytes = 0;
  let rowCount = 0;
  let files = 0;
  const entries = [...cityDataMap.entries()];

  for (let i = 0; i < entries.length; i += CHUNK) {
    const slice = entries.slice(i, i + CHUNK);
    await Promise.all(
      slice.map(async ([cityCode, dataList]) => {
        const prefCode = prefByCity.get(cityCode);
        if (!prefCode) return; // prefecture 不明はスキップ (データ整合性問題)
        const cityName = dataList[0].areaName;
        const cityRows = buildCityProfileRows(cityCode, cityName, dataList, now);
        if (cityRows.length === 0) return;

        const strengths: StrengthWeaknessItem[] = cityRows.map((r) => ({
          indicator: r.indicator,
          rankingKey: r.rankingKey,
          year: r.year,
          rank: r.rank,
          value: r.value,
          unit: r.unit,
          percentile: r.percentile,
        }));
        strengths.sort((a, b) => a.rank - b.rank);

        const profile: AreaProfileData = {
          areaCode: cityCode,
          areaName: cityName,
          strengths,
          weaknesses: [],
        };
        const result = await saveToR2(
          cityProfileKeyPath(prefCode, cityCode),
          JSON.stringify(profile),
          { contentType: "application/json; charset=utf-8" },
        );
        totalSizeBytes += result.size;
        rowCount += cityRows.length;
        files += 1;
      }),
    );
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    { files, rowCount, totalSizeBytes, durationMs },
    "city profile snapshot (完全DBレス) を R2 に保存しました",
  );

  return { files, rowCount, totalSizeBytes, durationMs };
}
