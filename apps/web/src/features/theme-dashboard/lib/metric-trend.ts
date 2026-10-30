import type { MetricTimeseriesResult } from '@/lib/aggregate-metric-timeseries';

/**
 * 指標 1 件の数値タイルに推移の小さなチャートを添えるかの判定 (2026-10-29。SingleMetricCard から切り出した)。
 *
 * チャートを出すかは指標ごとのフラグで持たず、観測値とカタログの章の構成から決める。次の 3 つがそろうときだけ出す:
 *  1. 県を選んでいる (47都道府県の表示では値が「1 位の県」の値なので、推移を描くと何の推移か分からない)
 *  2. 同じ章に、この指標の詳しいチャートが無い (あると同じ推移が 2 回出る。章の構成は ThemeCatalog.sections が決める)
 *  3. 推移に異なる年が MIN_TREND_YEARS (5) 以上ある。2〜4 年では直線か折れが 1〜2 回の線にしかならず、
 *     値と年を読めば足りる (2026-10-30 オーナー指摘。旧: 2 年以上で描き、2 点を結んだ直線が並んでいた)
 * 1・2 は取得の前に決まる (shouldFetchMetricTrend)。3 は取得した系列で決まる (resolveMetricTrend)。
 * 出さないときは何も置かない (理由の案内も出さない)。部品 (StatTile) は渡されたチャートを描くだけで判断しない。
 */

/** 推移の小さなチャートを描く最小の年の数 (異なる年の数) */
export const MIN_TREND_YEARS = 5;

export interface MetricTrendContext {
  /** 選択中の都道府県コード (null = 47都道府県・未選択) */
  selectedPrefectureCode: string | null;
  /** 同じ章のチャートがこの指標を描いている (ThemeMetricsDashboard が章の seriesRefs から求める) */
  coveredByChapterChart: boolean;
}

export type MetricTrend =
  | { kind: 'chart'; points: { year: number; value: number }[]; seriesName: string }
  | { kind: 'none' };

/**
 * 比較系列の凡例名 (MetricSwitcherPanel と共用)。
 *
 * ★47 県平均を「全国」と称してはならない (総人口のような実数系は全国値の 1/47 になる)。
 * 判定は action が返す source 申告に従う。正典は aggregate-metric-timeseries.ts。
 * (docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md §3.1)
 */
export function nationalSeriesName(result: MetricTimeseriesResult | undefined): string {
  return result?.source === 'national' ? '全国' : '都道府県平均';
}

/** 推移を取りに行くか (条件 1・2)。取りに行かない指標は時系列の通信をしない */
export function shouldFetchMetricTrend({
  selectedPrefectureCode,
  coveredByChapterChart,
}: MetricTrendContext): boolean {
  return selectedPrefectureCode !== null && !coveredByChapterChart;
}

/**
 * 取得した系列から描く推移を決める (条件 3)。県の系列が空なら 全国 → 47 県平均 (fallbackSeries) の順に代える。
 * 自地域と全国の両方が届くまでは 'none' (届く前に代わりの系列で描いて差し替えない)。
 */
export function resolveMetricTrend({
  areaName,
  areaResult,
  nationalResult,
  fallbackSeries,
}: {
  areaName: string;
  areaResult: MetricTimeseriesResult | undefined;
  nationalResult: MetricTimeseriesResult | undefined;
  /** カードが持つ 47 県平均の系列 (MetricKpi.series) */
  fallbackSeries: readonly { year: number | string; value: number }[];
}): MetricTrend {
  if (!areaResult || !nationalResult) return { kind: 'none' };

  let points: { year: string; value: number }[] = areaResult.points;
  let seriesName = areaName;
  if (points.length === 0 && nationalResult.points.length > 0) {
    points = nationalResult.points;
    seriesName = nationalSeriesName(nationalResult);
  } else if (points.length === 0 && fallbackSeries.length > 0) {
    points = fallbackSeries.map((p) => ({ year: String(p.year), value: p.value }));
    seriesName = '都道府県平均';
  }
  if (new Set(points.map((p) => p.year)).size < MIN_TREND_YEARS) return { kind: 'none' };
  return {
    kind: 'chart',
    seriesName,
    points: points.map((p) => ({ year: Number(p.year), value: p.value })),
  };
}
