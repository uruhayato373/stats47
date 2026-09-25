'use server';

import { METRICS_REGISTRY } from '@stats47/data-configs/registry';
import { readRankingItemFromR2 } from '@stats47/ranking/server';
import { readStatsValues } from '@stats47/stats-r2/readers';
import { isOk } from '@stats47/types';

import {
  aggregateMetricTimeseries,
  EMPTY_TIMESERIES as EMPTY_RESULT,
  type MetricTimeseriesResult,
  type TimeseriesSourceRow,
} from '../lib/aggregate-metric-timeseries';
import { themeYearLabel } from '../lib/theme-year-label';


export type {
  MetricTimeseriesPoint,
  MetricTimeseriesResult,
  MetricTimeseriesSource,
} from '../lib/aggregate-metric-timeseries';

/**
 * 指標の時系列データを取得する Server Action
 *
 * 選択中の都道府県 (areaCode) について metric の全年度値を返す。
 * areaCode='00000' は全国 (e-Stat に全国行があれば採用、無ければ 47 県平均)。
 * 集約と出所判定は純粋関数 `aggregateMetricTimeseries` が持つ (テストで固定)。
 */

export async function fetchMetricTimeseriesAction(
  rankingKey: string,
  areaCode: string
): Promise<MetricTimeseriesResult> {
  const [result] = await loadTimeseriesForAreas(rankingKey, [areaCode]);
  return result;
}

export interface MetricTimeseriesRequest {
  rankingKey: string;
  areaCode: string;
}

/** 1 回で受け付ける要求の上限 (クライアントの MAX_BATCH_SIZE と同じ値) */
const MAX_BATCH_REQUESTS = 60;

/**
 * 複数の (指標, 地域) の時系列をまとめて返す Server Action。結果は要求と同じ順。
 *
 * ブラウザはサーバーアクションを 1 件ずつ順番に処理するため、指標カードごとに呼ぶと
 * テーマページで 48 件が一列に並び約 19 秒かかった (2026-09-25)。ここでは指標ごとに
 * R2 を 1 回だけ読み、選択県と全国を同じ読み込みから作る。
 */
export async function fetchMetricTimeseriesBatchAction(
  requests: MetricTimeseriesRequest[]
): Promise<MetricTimeseriesResult[]> {
  if (!Array.isArray(requests) || requests.length > MAX_BATCH_REQUESTS) {
    throw new Error(`時系列の一括取得は 1 回 ${MAX_BATCH_REQUESTS} 件まで`);
  }
  const areasByKey = new Map<string, string[]>();
  for (const request of requests) {
    if (typeof request?.rankingKey !== 'string' || typeof request?.areaCode !== 'string') {
      throw new Error('時系列の要求が不正');
    }
    const areas = areasByKey.get(request.rankingKey) ?? [];
    if (!areas.includes(request.areaCode)) areas.push(request.areaCode);
    areasByKey.set(request.rankingKey, areas);
  }
  const resolved = new Map<string, MetricTimeseriesResult>();
  await Promise.all(
    [...areasByKey].map(async ([rankingKey, areaCodes]) => {
      const results = await loadTimeseriesForAreas(rankingKey, areaCodes);
      areaCodes.forEach((areaCode, i) => resolved.set(`${rankingKey}\u0000${areaCode}`, results[i]));
    })
  );
  return requests.map(
    (request) => resolved.get(`${request.rankingKey}\u0000${request.areaCode}`) ?? EMPTY_RESULT
  );
}

/** 1 指標の R2 を 1 回だけ読み、複数地域の時系列を作る */
async function loadTimeseriesForAreas(
  rankingKey: string,
  areaCodes: string[]
): Promise<MetricTimeseriesResult[]> {
  const empty = () => areaCodes.map(() => EMPTY_RESULT);
  const result = await readRankingItemFromR2(rankingKey, 'prefecture');
  if (!result || !isOk(result) || !result.data) return empty();

  /**
   * 全MetricConfigは投入時に取得・派生・単位換算を完了し、Web runtime は
   * `app/stats/<key>/values.json` だけを読む。欠落時に直APIへ戻すと、派生式や
   * valueScaleを迂回した別値が同じ画面へ混入するため、必ず空結果にする。
   */
  try {
    const rawData: TimeseriesSourceRow[] =
      (await readStatsValues(rankingKey, 'prefecture'))?.rows ?? [];
    if (!rawData || rawData.length === 0) return empty();

    const yearFormat = METRICS_REGISTRY[rankingKey]?.yearFormat;
    return areaCodes.map((areaCode) => {
      const aggregated = aggregateMetricTimeseries(rawData, areaCode);
      return {
        ...aggregated,
        points: aggregated.points.map((point) => ({
          ...point,
          yearName: themeYearLabel(point.year, point.yearName, yearFormat),
        })),
      };
    });
  } catch {
    return empty();
  }
}
