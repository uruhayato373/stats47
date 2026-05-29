import "server-only";

import { listRankingItemsWithTagsFromR2, listRankingValues } from "@stats47/ranking/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

import { buildAreaProfileRows, type AreaRankingData } from "../utils/build-area-profile-rows";
import type { AreaProfileData, StrengthWeaknessItem } from "../types";
import { areaProfileKeyPath } from "../types/snapshot";

const AREA_TYPE = "prefecture";

export interface ExportAreaProfileSnapshotResult {
  files: number;
  rowCount: number;
  totalSizeBytes: number;
  durationMs: number;
}

/**
 * 都道府県プロファイル (強み・弱み) を R2 `app/areas/{areaCode}/profile.json` に保存する。
 *
 * 完全DBレス (docs/01_技術設計/19_完全DBレス設計.md): 中間 D1 `area_profiles` テーブルを
 * 経由せず、R2 から直接計算して書き出す:
 *   - ranking item メタ = R2 item.json (listRankingItemsWithTagsFromR2)
 *   - 観測値           = R2 app/stats/<metric>/values.json (listRankingValues)
 *   - 強み/弱み判定     = buildAreaProfileRows (既存 pure util、threshold 不変)
 *
 * 出力 (AreaProfileData / profile.json) は旧 D1 版と同一構造。
 * (旧実装は area_profiles INNER JOIN metrics を読んでいた。読取りランタイムは
 *  readAreaProfileFromR2 が R2 profile.json のみ参照するため D1 は不要。)
 */
export async function exportAreaProfileSnapshot(): Promise<ExportAreaProfileSnapshotResult> {
  const startedAt = Date.now();

  // --- 1. 全ランキング項目 (R2 item.json) を取得 ---
  const itemsResult = await listRankingItemsWithTagsFromR2({
    areaType: AREA_TYPE,
    isActive: true,
  });
  if (!itemsResult.success) {
    throw itemsResult.error ?? new Error("listRankingItemsWithTagsFromR2 failed");
  }
  const items = itemsResult.data.filter((item) => item.latestYear?.yearCode);

  // --- 2. 各項目の最新年の観測値を取得し、地域ごとに集約 ---
  const areaDataMap = new Map<string, AreaRankingData[]>();
  for (const item of items) {
    const yearCode = item.latestYear!.yearCode;
    const valuesResult = await listRankingValues(item.rankingKey, AREA_TYPE, yearCode);
    if (!valuesResult.success || valuesResult.data.length === 0) continue;

    for (const rv of valuesResult.data) {
      if (rv.value === null) continue;
      const list = areaDataMap.get(rv.areaCode) ?? [];
      list.push({
        rankingKey: item.rankingKey,
        indicator: item.title,
        year: item.latestYear!.yearName,
        rank: rv.rank,
        value: rv.value,
        unit: item.unit,
        areaName: rv.areaName,
      });
      areaDataMap.set(rv.areaCode, list);
    }
  }

  // --- 3. 地域ごとに強み・弱みを判定し profile.json を直接 R2 へ書き出す ---
  const now = new Date().toISOString();
  let totalSizeBytes = 0;
  let rowCount = 0;
  let files = 0;

  await Promise.all(
    [...areaDataMap.entries()].map(async ([areaCode, dataList]) => {
      if (dataList.length === 0) return;
      const areaName = dataList[0].areaName;
      const rows = buildAreaProfileRows(areaCode, areaName, dataList, now);

      const strengths: StrengthWeaknessItem[] = [];
      const weaknesses: StrengthWeaknessItem[] = [];
      for (const r of rows) {
        const swItem: StrengthWeaknessItem = {
          indicator: r.indicator,
          rankingKey: r.rankingKey,
          year: r.year,
          rank: r.rank,
          value: r.value,
          unit: r.unit,
          percentile: r.percentile,
        };
        if (r.type === "strength") strengths.push(swItem);
        else if (r.type === "weakness") weaknesses.push(swItem);
      }
      strengths.sort((a, b) => a.rank - b.rank);
      weaknesses.sort((a, b) => b.rank - a.rank);

      const profile: AreaProfileData = { areaCode, areaName, strengths, weaknesses };
      const result = await saveToR2(areaProfileKeyPath(areaCode), JSON.stringify(profile), {
        contentType: "application/json; charset=utf-8",
      });
      totalSizeBytes += result.size;
      rowCount += rows.length;
      files += 1;
    }),
  );

  const durationMs = Date.now() - startedAt;
  logger.info(
    { files, rowCount, totalSizeBytes, durationMs },
    "area_profiles snapshot (完全DBレス) を R2 に保存しました",
  );

  return { files, rowCount, totalSizeBytes, durationMs };
}
