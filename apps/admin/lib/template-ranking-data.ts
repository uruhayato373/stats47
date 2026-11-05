import { maximumTemperature } from '../../../data/metrics/maximum-temperature';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import {
  assertMetricPresentation,
  resolveBarDomain,
  DEFAULT_BAR_DOMAIN,
  type MetricPresentation,
} from '../../../packages/types/src/metric-presentation';
import { niceTicks } from '../../../packages/svg-builder/src/shared/axis';
import { formatValueWithPrecision, resolveValuePrecision } from '@stats47/utils';
import type { TileValueDisplay } from '../../remotion/src/features/data-cards/tile-scale';
import { formatChartValue, resolveChartDisplayScale } from '../../../packages/data-configs/src/unit/chart-display-scale';
import { formatUnitForDisplay } from '../../../packages/data-configs/src/unit/unit-display';

/** A fixed real-data example; article associations are managed as usage, not input. */
export const RANKING_SAMPLE_METRIC = maximumTemperature;
export const RANKING_SAMPLE_YEAR = '2024';
export const RANKING_SAMPLE_SOURCE = {
  bucket: 'stats47',
  key: 'app/stats/maximum-temperature/values.json',
  sha256: '1c5dfecf954d41eab0ef35904cf948717b60398e819d66539cf4eb70c5b94d82',
  bytes: 273844,
} as const;

export function rankingInputFromStats(raw: unknown) {
  const input = parseStatsValuesPayload(raw);
  if (input.metricKey !== RANKING_SAMPLE_METRIC.key || input.entityKind !== 'prefecture')
    throw new Error('代表統計の指標・地域が一致しません。');
  const rows = input.rows.filter((row) => row.yearCode === RANKING_SAMPLE_YEAR);
  if (rows.some((row) => row.unit !== RANKING_SAMPLE_METRIC.unit))
    throw new Error('代表統計の単位が一致しません。');
  return {
    _meta: { rankingKey: input.metricKey, year: Number(RANKING_SAMPLE_YEAR) },
    unit: RANKING_SAMPLE_METRIC.unit,
    data: rows.map((row) => ({
      rank: row.rank, area_code: row.areaCode, area_name: row.areaName,
      year: row.yearCode, value: row.value,
    })),
  };
}

export function rankingSampleLabels() {
  const metric = RANKING_SAMPLE_METRIC;
  assertMetricPresentation(metric.visualization);
  const format = new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: metric.display?.decimalPlaces ?? 0,
    maximumFractionDigits: metric.display?.decimalPlaces ?? 0,
  });
  const factor = metric.display?.conversionFactor ?? 1;
  return {
    title: metric.title + 'ランキング', subtitle: metric.subtitle ?? '',
    unit: formatUnitForDisplay(metric.display?.displayUnit ?? metric.unit),
    source: 'displayName' in metric.source ? metric.source.displayName ?? '' : '',
    formatValue: (value: number) => format.format(value * factor),
  };
}

/** Read the authored bar policy; comparisonDomain remains the site's dot-plot policy. */
export function rankingBarAxis(values: number[], presentation: MetricPresentation = RANKING_SAMPLE_METRIC.visualization) {
  assertMetricPresentation(presentation);
  const policy = presentation.barDomain ?? DEFAULT_BAR_DOMAIN;
  const domain = resolveBarDomain(values, policy);
  if (!domain) throw new Error('棒グラフの値がありません。');
  const [min, max] = domain;
  const gap = (max - min) * 0.08;
  const ticks = [min, ...niceTicks(min, max, 4).filter((value) => value > min + gap && value < max - gap), max];
  const baseline = Math.max(min, Math.min(max, 0));
  return { min, max, ticks, policy, baseline, truncated: baseline !== 0 };
}

/** One prefecture of a complete ranking: value as stored (before display conversion). */
export interface RankingChartRow { rank: number; area_code: string; area_name: string; value: number }
/**
 * Everything a ranking type (bars, tile map, real-shape map) draws: the metric's labels and colour
 * policy plus all 47 prefectures. Built from the fixed sample here and from article data for the blog.
 */
export interface RankingChart {
  /** Metric name without 「ランキング」. */
  title: string;
  /** As shown, e.g. 「2024年」「2022年度」. */
  yearLabel: string;
  unit: string;
  source: string;
  note?: string;
  presentation: MetricPresentation;
  display?: TileValueDisplay;
  rows: RankingChartRow[];
  formatValue: (value: number) => string;
  /** The area the others are measured against. Its row holds 0 so all 47 stay on the map; it is not an observation. */
  baseAreaCode?: string;
}

/** 47 prefectures, each once, ranks consistent with values (ties share a rank); sorted by rank. */
export function assertRankingRows(rows: RankingChartRow[]) {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank || b.value - a.value);
  const codes = new Set(rows.map((r) => r.area_code));
  if (rows.length !== 47 || codes.size !== 47 ||
      rows.some((r) => !/^\d{2}000$/.test(r.area_code) || Number(r.area_code.slice(0, 2)) < 1 || Number(r.area_code.slice(0, 2)) > 47 || !Number.isFinite(r.value)) ||
      sorted.some((r, i) => r.rank !== sorted.findIndex((other) => other.value === r.value) + 1 || (i > 0 && r.value > sorted[i - 1].value)))
    throw new Error('47都道府県の順位と値の順序を確認してください。');
  return sorted;
}

/** Dataset-precision formatter (33 and 33.8 read 33.0 and 33.8) for charts without a display policy. */
export function datasetFormatter(values: number[]) {
  const precision = resolveValuePrecision(values);
  return (value: number) => formatValueWithPrecision(value, precision);
}

/**
 * The unit a chart writes and how its values read: large quantities in 万・億・兆 with one unit for the
 * whole chart (resolveChartDisplayScale, the unit canon), otherwise the stored unit with the metric's
 * decimal places or the dataset's precision. Values stay as stored; only their text changes.
 */
export function chartValueLabels(unit: string, values: number[], decimalPlaces?: number) {
  const scale = resolveChartDisplayScale(unit, values);
  if (scale.reason === 'rescaled') {
    return {
      unit: scale.unit,
      display: { conversionFactor: scale.factor, decimalPlaces: scale.decimals ?? undefined } as TileValueDisplay,
      formatValue: (value: number) => formatChartValue(value, scale),
    };
  }
  if (decimalPlaces === undefined) return { unit: scale.unit, display: undefined, formatValue: datasetFormatter(values) };
  return { unit: scale.unit, display: { decimalPlaces } as TileValueDisplay, formatValue: (value: number) => formatChartValue(value, { factor: 1, decimals: decimalPlaces }) };
}

/** The fixed real-data sample as a chart, optionally with another bar/colour policy. */
export function sampleRankingChart(raw: { data: RankingChartRow[] }, presentation: MetricPresentation = RANKING_SAMPLE_METRIC.visualization): RankingChart {
  const label = rankingSampleLabels();
  const rows = assertRankingRows(raw.data);
  const values = chartValueLabels(RANKING_SAMPLE_METRIC.unit, rows.map((r) => r.value), RANKING_SAMPLE_METRIC.display?.decimalPlaces);
  return {
    title: RANKING_SAMPLE_METRIC.title, yearLabel: `${RANKING_SAMPLE_YEAR}年`, source: label.source,
    note: label.subtitle || undefined, presentation, rows, ...values,
  };
}
