import { NATIONAL_AREA_CODE } from '@stats47/area';

import type { PageComponent } from '@/components/stat-charts';

import type { MetricTimeseriesResult } from '@/lib/aggregate-metric-timeseries';

import {
  fetchMetricTimeseriesBatchAction,
  type MetricTimeseriesRequest,
} from '../actions/fetch-metric-timeseries';

import { loadThemeChartResult, type ThemeChartLoadResult } from './theme-chart-result';


/** サーバーが初回描画で渡すデータ。指標カードと章の図が表示直後に取りに行く分 */
export interface InitialThemeData {
  /** 図の結果を解決した地域 (県のコード、または全国) */
  areaCode: string;
  /** 指標 → 地域コード → 時系列 (県を表示するページだけ。全国のページの指標カードは取りに行かない) */
  timeseries: Record<string, Record<string, MetricTimeseriesResult>>;
  /** 図のキー (componentKey) → 結果 */
  chartResults: Record<string, ThemeChartLoadResult>;
}

/** `fetchMetricTimeseriesBatchAction` が 1 回で受け付ける上限 */
const BATCH_SIZE = 60;

async function loadTimeseries(
  metricKeys: readonly string[],
  areaCode: string
): Promise<InitialThemeData['timeseries']> {
  const requests: MetricTimeseriesRequest[] = metricKeys.flatMap((rankingKey) =>
    [areaCode, NATIONAL_AREA_CODE].map((code) => ({ rankingKey, areaCode: code }))
  );
  const timeseries: InitialThemeData['timeseries'] = {};
  try {
    for (let start = 0; start < requests.length; start += BATCH_SIZE) {
      const batch = requests.slice(start, start + BATCH_SIZE);
      const results = await fetchMetricTimeseriesBatchAction(batch);
      batch.forEach((request, index) => {
        (timeseries[request.rankingKey] ??= {})[request.areaCode] = results[index];
      });
    }
  } catch {
    return {};
  }
  return timeseries;
}

async function loadChartResults(
  charts: readonly PageComponent[],
  areaCode: string
): Promise<InitialThemeData['chartResults']> {
  const keyed = charts.filter(
    (chart) => chart.componentKey && chart.componentType !== 'markdown-section'
  );
  const results = await Promise.all(keyed.map((chart) => loadThemeChartResult(chart, areaCode)));
  // 取得できなかった図は渡さない (クライアントが従来どおり取りに行く)
  return Object.fromEntries(
    keyed
      .map((chart, index) => [chart.componentKey, results[index]] as const)
      .filter(([, result]) => result.state !== 'source-unavailable')
  );
}

/**
 * 初回に表示する地域のデータを、サーバーの描画の中で読む。
 * 読めなかった分は空のまま返し、指標カードと図は従来どおり自分で取りに行く。
 */
export async function loadInitialThemeData({
  metricKeys,
  charts,
  prefectureCode,
}: {
  metricKeys: readonly string[];
  charts: readonly PageComponent[];
  /** 表示する県。全国のページは null */
  prefectureCode: string | null;
}): Promise<InitialThemeData> {
  const areaCode = prefectureCode ?? NATIONAL_AREA_CODE;
  const [timeseries, chartResults] = await Promise.all([
    prefectureCode ? loadTimeseries(metricKeys, prefectureCode) : Promise.resolve({}),
    loadChartResults(charts, areaCode),
  ]);
  return { areaCode, timeseries, chartResults };
}
