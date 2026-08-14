"use server";

import {
  PYRAMID_AGE_GROUPS,
  PYRAMID_STATS_DATA_ID,
  enumeratePyramidCategoryCodes,
} from "@stats47/data-configs/theme-catalog";
import {
  fetchFormattedStats,
  type GetStatsDataParams,
} from "@stats47/estat-api/server";

import { getEstatCacheStorage } from "@/components/stat-charts/server";

import type { PyramidChartData } from "@stats47/visualization/d3";



/**
 * 5歳階級別人口ピラミッドデータを取得
 *
 * e-Stat 社会・人口統計体系（statsDataId: 0000010101）から
 * 0〜4歳〜100歳以上の21年齢階級 × 男女 = 42コードを並列取得。
 * cdArea/cdTime 指定なしで全都道府県・全年度を一括取得し、R2 キャッシュを共有する。
 */

// ★年齢×性別コードの SSOT は data-configs に移設 (WP4)。app fetch と依存 collector が共有し、
//   catalog から pyramid の 34 request を機械列挙できるようにする。
const STATS_DATA_ID = PYRAMID_STATS_DATA_ID;

export interface PopulationPyramidResult {
  pyramidData: PyramidChartData[];
  yearName: string;
}

export async function fetchPopulationPyramidAction(
  prefCode: string,
): Promise<PopulationPyramidResult | null> {
  try {
    const storage = await getEstatCacheStorage();

    // 34 コードを並列取得（各コードは R2 キャッシュ済みなら即返却）。SSOT = data-configs。
    const codes = enumeratePyramidCategoryCodes();

    const results = await Promise.all(
      codes.map(async (c) => {
        const params: GetStatsDataParams = {
          statsDataId: STATS_DATA_ID,
          cdCat01: c.code,
        };
        const data = await fetchFormattedStats(params, storage);
        return { ...c, data };
      }),
    );

    // 最新年度を特定（最初の結果から）
    const firstResult = results[0]?.data.filter((d) => d.areaCode === prefCode);
    if (!firstResult || firstResult.length === 0) return null;

    const latestYear = firstResult.reduce((latest, d) =>
      d.yearCode > latest.yearCode ? d : latest,
    );
    const yearCode = latestYear.yearCode;
    const yearName = latestYear.yearName ?? yearCode;

    // 各年齢階級の男女データを PyramidChartData に変換
    const pyramidData: PyramidChartData[] = PYRAMID_AGE_GROUPS.map((ag) => {
      const maleResult = results.find(
        (r) => r.code === `${ag.base}01`,
      );
      const femaleResult = results.find(
        (r) => r.code === `${ag.base}02`,
      );

      const maleValue =
        maleResult?.data.find(
          (d) => d.areaCode === prefCode && d.yearCode === yearCode,
        )?.value ?? 0;
      const femaleValue =
        femaleResult?.data.find(
          (d) => d.areaCode === prefCode && d.yearCode === yearCode,
        )?.value ?? 0;

      return {
        ageGroup: ag.label,
        male: -Math.abs(Number(maleValue)),
        female: Math.abs(Number(femaleValue)),
      };
    });

    return { pyramidData, yearName };
  } catch {
    return null;
  }
}
