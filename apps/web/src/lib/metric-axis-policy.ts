import { NATIONAL_AREA_CODE } from '@stats47/area';
import { readRankingItemFromR2 } from '@stats47/ranking/server';
import { readStatsValues } from '@stats47/stats-r2/readers';
import {
  isOk,
  resolveChartDomain,
  DEFAULT_BAR_DOMAIN,
  type NumericDomainPolicy,
} from '@stats47/types';

import { aggregateMetricTimeseries } from './aggregate-metric-timeseries';
import { selectMetricDomainPolicy } from './metric-presentation';

import type {
  StatSeriesRef,
  LineChartComponentProps,
} from '@stats47/data-configs/theme-catalog';

export async function resolveMetricAxisPolicy(
  refs: StatSeriesRef[],
  override?: LineChartComponentProps['yAxisConfig'],
  purpose: 'trend' | 'bar' = 'trend'
): Promise<NumericDomainPolicy> {
  const keys = [...new Set(refs.map((ref) => ref.metricKey))];
  const policies = await Promise.all(
    keys.map(async (key) => {
      const result = await readRankingItemFromR2(key, 'prefecture');
      if (!isOk(result) || !result.data)
        throw new Error('Missing metric presentation: ' + key);
      return purpose === 'bar'
        ? (result.data.visualization.barDomain ?? DEFAULT_BAR_DOMAIN)
        : result.data.visualization.trendDomain;
    })
  );
  if (override?.mode === 'fixed') {
    if (!override.domain) throw new Error('Fixed chart domain missing');
    return { mode: 'fixed', min: override.domain[0], max: override.domain[1] };
  }
  const policy = selectMetricDomainPolicy(policies);
  if (override?.mode === 'sync') {
    const all = await Promise.all(
      keys.map((key) => readStatsValues(key, 'prefecture'))
    );
    if (all.some((payload) => !payload))
      throw new Error('Missing observations for synchronized axis');
    const domain = resolveChartDomain(
      refs.flatMap((ref) => {
        const rows = all[keys.indexOf(ref.metricKey)]!.rows.filter(
          (row) => !ref.year || row.yearCode === ref.year
        );
        return ref.area === 'national'
          ? aggregateMetricTimeseries(rows, NATIONAL_AREA_CODE).points.map(
              (point) => point.value
            )
          : rows
              .filter((row) => row.areaCode !== NATIONAL_AREA_CODE)
              .map((row) => row.value);
      }),
      policy
    );
    if (domain) return { mode: 'fixed', min: domain[0], max: domain[1] };
  }
  return policy;
}
