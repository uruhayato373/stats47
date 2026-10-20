import {
  resolveObservationDomain,
  type StatsSchema,
  type YAxisConfig,
  type ObservationDomainMode,
} from '@stats47/types';

import { resolveMetricAxisPolicy } from '@/lib/metric-axis-policy';

import {
  fetchEstatDataAllAreas,
  type LegacyStatParams,
} from '../services/fetchEstatData';

interface ComputeYAxisDomainOptions {
  yAxisConfig?: YAxisConfig;
  estatParams: LegacyStatParams[];
  domainType?: ObservationDomainMode;
  rows?: StatsSchema[];
  areaCodes?: string[];
}
/** Fetching/cohort selection stays here; the numeric calculation belongs to types. */
export async function computeYAxisDomain({
  yAxisConfig,
  estatParams,
  domainType = 'zeroMax',
  rows,
  areaCodes,
}: ComputeYAxisDomainOptions): Promise<[number, number] | undefined> {
  let selected = rows;
  if (yAxisConfig?.mode === 'sync' || !selected) {
    const results = await Promise.all(estatParams.map(fetchEstatDataAllAreas));
    if (results.some((result) => 'error' in result))
      throw new Error('Missing observations for synchronized axis');
    selected = results.flatMap((result) =>
      'data' in result ? result.data : []
    );
  }
  if (areaCodes)
    selected = selected.filter((row) => areaCodes.includes(row.areaCode));
  const refs = [...new Set(selected.map((row) => row.metricKey))].map(
    (metricKey) => ({ metricKey })
  );
  const policy = await resolveMetricAxisPolicy(
    refs,
    yAxisConfig?.mode === 'fixed' ? yAxisConfig : undefined,
    domainType === 'minMax' ? 'trend' : 'bar'
  );
  return resolveObservationDomain(selected, policy, domainType) ?? undefined;
}
