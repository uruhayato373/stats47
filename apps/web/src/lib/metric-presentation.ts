import { selectNumericDomainPolicy, type NumericDomainPolicy } from '@stats47/types';

import { DEFAULT_METRIC_PRESENTATION } from '../../../../data/metrics/defaults/presentation';

export function selectMetricDomainPolicy(
  policies: NumericDomainPolicy[]
): NumericDomainPolicy {
  return selectNumericDomainPolicy(
    policies,
    DEFAULT_METRIC_PRESENTATION.trendDomain
  );
}
export { resolveSeriesDomain as metricSeriesDomain } from '@stats47/types';
