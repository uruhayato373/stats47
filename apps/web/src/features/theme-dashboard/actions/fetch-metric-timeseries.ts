"use server";

import {
  readRankingItemFromR2,
} from "@stats47/ranking/server";
import { readStatsValues } from "@stats47/stats-r2/readers";
import { isOk } from "@stats47/types";

import {
  aggregateMetricTimeseries,
  EMPTY_TIMESERIES as EMPTY_RESULT,
  type MetricTimeseriesResult,
  type TimeseriesSourceRow,
} from "../lib/aggregate-metric-timeseries";

export type {
  MetricTimeseriesPoint,
  MetricTimeseriesResult,
  MetricTimeseriesSource,
} from "../lib/aggregate-metric-timeseries";

/**
 * 指標の時系列データを取得する Server Action
 *
 * 選択中の都道府県 (areaCode) について metric の全年度値を返す。
 * areaCode='00000' は全国 (e-Stat に全国行があれば採用、無ければ 47 県平均)。
 * 集約と出所判定は純粋関数 `aggregateMetricTimeseries` が持つ (テストで固定)。
 */

export async function fetchMetricTimeseriesAction(
  rankingKey: string,
  areaCode: string,
): Promise<MetricTimeseriesResult> {
  const result = await readRankingItemFromR2(rankingKey, "prefecture");
  if (!result || !isOk(result) || !result.data) return EMPTY_RESULT;

  /**
   * 全MetricConfigは投入時に取得・派生・単位換算を完了し、Web runtime は
   * `app/stats/<key>/values.json` だけを読む。欠落時に直APIへ戻すと、派生式や
   * valueScaleを迂回した別値が同じ画面へ混入するため、必ず空結果にする。
   */
  try {
    const rawData: TimeseriesSourceRow[] =
      (await readStatsValues(rankingKey, "prefecture"))?.rows ?? [];
    if (!rawData || rawData.length === 0) return EMPTY_RESULT;

    return aggregateMetricTimeseries(rawData, areaCode);
  } catch {
    return EMPTY_RESULT;
  }
}
