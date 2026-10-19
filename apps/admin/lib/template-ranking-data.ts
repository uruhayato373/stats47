import { maximumTemperature } from '../../../data/metrics/maximum-temperature';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import { assertMetricPresentation, resolveBarDomain, DEFAULT_BAR_DOMAIN, type MetricPresentation } from '../../../packages/types/src/metric-presentation';
import { niceScale, niceTicks } from '../../../packages/svg-builder/src/shared/axis';

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
    unit: metric.display?.displayUnit ?? metric.unit,
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
  const min = policy.mode !== 'zero' ? domain[0] : domain[0] < 0 ? -niceScale(-domain[0], 4).max : 0;
  const max = policy.mode !== 'zero' ? domain[1] : domain[1] > 0 ? niceScale(domain[1], 4).max : 0;
  const gap = (max - min) * 0.08;
  const ticks = [min, ...niceTicks(min, max, 4).filter((value) => value > min + gap && value < max - gap), max];
  const baseline = Math.max(min, Math.min(max, 0));
  return { min, max, ticks, policy, baseline, truncated: baseline !== 0 };
}
