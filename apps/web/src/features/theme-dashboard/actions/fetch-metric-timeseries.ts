"use server";

import {
  fetchFormattedStats,
  type GetStatsDataParams,
} from "@stats47/estat-api/server";
import {
  isDerivedSource,
  readRankingItemFromR2,
  resolveEstatParams,
} from "@stats47/ranking/server";
import { readStatsValues } from "@stats47/stats-r2/readers";
import { isOk } from "@stats47/types";

import { getEstatCacheStorage } from "@/components/stat-charts/server";

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

  const rankingItem = result.data;
  const { sourceConfig, calculation } = rankingItem;

  // 計算型は全年度 timeseries 取得未対応 (Phase 3.5 で個別対応)
  if (calculation?.isCalculated) {
    return EMPTY_RESULT;
  }

  // ★sourceConfig を丸ごと spread しない (cdCat03/04/05・cdTab の欠落と非クエリキー混入を防ぐ)
  const params = resolveEstatParams(sourceConfig);
  if (!params) return EMPTY_RESULT;

  try {
    // 宣言演算 (tab 線形結合 / 軸合算 / 率 / 県庁所在市写像) を伴う metric は
    // e-Stat 単発クエリで再現できないので、取り込み済みの正典 R2 から読む。
    const rawData: TimeseriesSourceRow[] = isDerivedSource(sourceConfig)
      ? ((await readStatsValues(rankingKey, "prefecture"))?.rows ?? [])
      : await fetchFormattedStats(params as GetStatsDataParams, await getEstatCacheStorage());
    if (!rawData || rawData.length === 0) return EMPTY_RESULT;

    return aggregateMetricTimeseries(rawData, areaCode);
  } catch {
    return EMPTY_RESULT;
  }
}
