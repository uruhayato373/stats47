"use server";

import {
  fetchFormattedStats,
  type GetStatsDataParams,
} from "@stats47/estat-api/server";

import { toCompositionChartData } from "@/features/stat-charts/adapters/toCompositionChartData";
import { getEstatCacheStorage } from "@/features/stat-charts/server";

import type { AgeCompositionData } from "../components";

/**
 * 年齢3区分人口（実数）の年次推移データを取得
 *
 * e-Stat 社会・人口統計体系（statsDataId: 0000010101）から
 * 15歳未満人口・15-64歳人口・65歳以上人口（単位: 人）を取得。
 * cdArea/cdTime 指定なしで全都道府県・全年度を一括取得し、R2 キャッシュを共有する。
 */

const STATS_DATA_ID = "0000010101";
const NATIONAL_AREA_CODE = "00000";

const SEGMENTS = [
  { code: "A1301", label: "15歳未満", color: "#22c55e" },
  { code: "A1302", label: "15〜64歳", color: "#3b82f6" },
  { code: "A1303", label: "65歳以上", color: "#ef4444" },
] as const;

export interface AgeCompositionResult {
  prefData: AgeCompositionData | null;
  nationalData: AgeCompositionData | null;
}

export async function fetchPopulationCompositionAction(
  prefCode: string | null,
): Promise<AgeCompositionResult> {
  try {
    const storage = await getEstatCacheStorage();
    const labels = SEGMENTS.map((s) => s.label);
    const colors = SEGMENTS.map((s) => s.color);

    // 全セグメントを並列取得（キャッシュ共有）
    const allSegmentData = await Promise.all(
      SEGMENTS.map(async (seg) => {
        const params: GetStatsDataParams = {
          statsDataId: STATS_DATA_ID,
          cdCat01: seg.code,
        };
        return fetchFormattedStats(params, storage);
      }),
    );

    // 全国データ
    const nationalRawList = allSegmentData.map((data) =>
      data.filter((d) => d.areaCode === NATIONAL_AREA_CODE),
    );
    const nationalChart = toCompositionChartData(nationalRawList, labels, colors);
    const nationalData: AgeCompositionData | null =
      nationalChart.trendData.length > 0 ? nationalChart : null;

    // 都道府県データ
    let prefData: AgeCompositionData | null = null;
    if (prefCode && prefCode !== NATIONAL_AREA_CODE) {
      const prefRawList = allSegmentData.map((data) =>
        data.filter((d) => d.areaCode === prefCode),
      );
      if (prefRawList.every((d) => d.length > 0)) {
        const prefChart = toCompositionChartData(prefRawList, labels, colors);
        if (prefChart.trendData.length > 0) {
          prefData = prefChart;
        }
      }
    }

    return { prefData, nationalData };
  } catch {
    return { prefData: null, nationalData: null };
  }
}
