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

  // ★sourceConfig を丸ごと spread しない (cdCat03/04/05・cdTab の欠落と非クエリキー混入を防ぐ)
  const params = resolveEstatParams(sourceConfig);

  /**
   * e-Stat の単発クエリでは正しい値を得られない metric。取り込み済みの正典
   * `app/stats/<key>/values.json` から読む。3 通りある:
   *
   * - **計算型** … 比・差の結果は e-Stat に存在しない。分子の statsDataId を叩くと
   *   変換前の生値が出てしまうので、絶対に e-Stat を叩かない
   * - **宣言演算 (derived)** … tab 線形結合 / 軸合算 / 率 / 県庁所在市写像は再現不能
   * - **params なし** … 国土数値情報・手動投入など external 種は e-Stat にクエリ自体が無い
   *
   * 最後の 1 つは 2026-08-05 まで即 EMPTY を返しており、R2 に複数年あるのに
   * チャートが空になっていた (ラスパイレス指数 14 年・鉄道駅乗降客数 5 年)。
   * 「e-Stat を叩けないなら諦める」ではなく「正典から読む」が正しい。
   */
  const useCanonicalR2 =
    calculation?.isCalculated === true || !params || isDerivedSource(sourceConfig);

  try {
    const rawData: TimeseriesSourceRow[] = useCanonicalR2
      ? ((await readStatsValues(rankingKey, "prefecture"))?.rows ?? [])
      : await fetchFormattedStats(params as GetStatsDataParams, await getEstatCacheStorage());
    if (!rawData || rawData.length === 0) return EMPTY_RESULT;

    return aggregateMetricTimeseries(rawData, areaCode);
  } catch {
    return EMPTY_RESULT;
  }
}
