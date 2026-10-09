import { resolveNumericDomain, type NumericDomainPolicy } from '@stats47/types';

import { DEFAULT_METRIC_PRESENTATION } from '../../../../data/metrics/defaults/presentation';
export function selectMetricDomainPolicy(
  policies: NumericDomainPolicy[]
): NumericDomainPolicy {
  return policies.length === 1
    ? policies[0]
    : DEFAULT_METRIC_PRESENTATION.trendDomain;
}
export function metricSeriesDomain(
  rows: Record<string, unknown>[],
  keys: string[],
  policy: NumericDomainPolicy,
  bars = false
): [number, number] | undefined {
  const values = rows.flatMap((row) =>
    keys.flatMap((key) =>
      typeof row[key] === 'number' ? [row[key] as number] : []
    )
  );
  const domain = resolveNumericDomain(
    values,
    bars && policy.mode !== 'fixed' ? { ...policy, mode: 'zero' } : policy
  );
  if (bars && domain && (domain[0] > 0 || domain[1] < 0))
    throw new Error('Bar domain must include zero');
  return domain ?? undefined;
}
