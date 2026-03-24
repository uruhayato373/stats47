"use server";

import { isOk } from "@stats47/types";

import { fetchAllYearsRankingValuesAction } from "@/features/ranking/actions/fetch-all-years-ranking-values";

/**
 * 都道府県の人口推移データ + 将来推計人口変化率を取得
 *
 * - total-population の全年度データから選択都道府県の推移を抽出
 * - future-population-change-rate-2050 があれば 2050年変化率も返却
 */

export interface FuturePopulationResult {
  trendData: Array<{ yearCode: string; yearName: string; value: number }>;
  changeRate2050: number | null;
}

export async function fetchFuturePopulationAction(
  prefCode: string,
): Promise<FuturePopulationResult | null> {
  try {
    // total-population の全年度データを取得
    const result = await fetchAllYearsRankingValuesAction(
      "total-population",
      "prefecture",
    );
    if (!isOk(result)) return null;

    const trendData = result.data
      .filter((v) => v.areaCode === prefCode)
      .sort((a, b) => a.yearCode.localeCompare(b.yearCode))
      .map((v) => ({
        yearCode: v.yearCode,
        yearName: v.yearName ?? v.yearCode,
        value: v.value,
      }));

    if (trendData.length === 0) return null;

    // future-population-change-rate-2050 を取得（存在しない場合は null）
    let changeRate2050: number | null = null;
    try {
      const futureResult = await fetchAllYearsRankingValuesAction(
        "future-population-change-rate-2050",
        "prefecture",
      );
      if (isOk(futureResult)) {
        const val = futureResult.data.find((v) => v.areaCode === prefCode);
        if (val) changeRate2050 = val.value;
      }
    } catch {
      // 存在しなければスキップ
    }

    return { trendData, changeRate2050 };
  } catch {
    return null;
  }
}
