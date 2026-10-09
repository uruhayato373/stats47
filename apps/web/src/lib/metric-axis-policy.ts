import { readRankingItemFromR2 } from '@stats47/ranking/server';
import { readStatsValues } from '@stats47/stats-r2/readers';
import {
  isOk,
  resolveNumericDomain,
  type NumericDomainPolicy,
} from '@stats47/types';

import { selectMetricDomainPolicy } from './metric-presentation';

import type {
  StatSeriesRef,
  LineChartComponentProps,
} from '@stats47/data-configs/theme-catalog';

export async function resolveMetricAxisPolicy(
  refs: StatSeriesRef[],
  override?: LineChartComponentProps['yAxisConfig']
): Promise<NumericDomainPolicy> {
  const keys = [...new Set(refs.map((ref) => ref.metricKey))];
  const policies = await Promise.all(
    keys.map(async (key) => {
      const result = await readRankingItemFromR2(key, 'prefecture');
      if (!isOk(result) || !result.data)
        throw new Error('Missing metric presentation: ' + key);
      return result.data.visualization.trendDomain;
    })
  );
  const policy = selectMetricDomainPolicy(policies);
  if (override?.mode === 'fixed') {
    if (!override.domain) throw new Error('Fixed chart domain missing');
    return { mode: 'fixed', min: override.domain[0], max: override.domain[1] };
  }
  if (override?.mode === 'sync') {
    const all = await Promise.all(
      keys.map((key) => readStatsValues(key, 'prefecture'))
    );
    if (all.some((payload) => !payload))
      throw new Error('Missing observations for synchronized axis');
    const dynamicPolicy =
      policy.mode === 'fixed'
        ? { mode: 'extent' as const, padding: 0.08 }
        : policy;
    const domain = resolveNumericDomain(
      all.flatMap((payload) => payload!.rows.map((row) => row.value)),
      dynamicPolicy
    );
    if (domain) return { mode: 'fixed', min: domain[0], max: domain[1] };
  }
  return policy;
}
