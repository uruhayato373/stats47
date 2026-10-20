import { computeYAxisDomain } from './computeYAxisDomain';

import type { DashboardConfigMap, DashboardComponentType } from '../types';

/** Both regions use the same selected population and authored policy. Failed reads propagate. */
export async function computeSharedYDomain(
  componentType: DashboardComponentType,
  config: Record<string, unknown>,
  areaCodes: string[]
): Promise<[number, number] | undefined> {
  if (
    !['line-chart', 'stacked-area', 'diverging-bar-chart'].includes(
      componentType
    )
  )
    return undefined;
  const chart = config as
    | DashboardConfigMap['line-chart']
    | DashboardConfigMap['stacked-area']
    | DashboardConfigMap['diverging-bar-chart'];
  const estatParams = Array.isArray(chart.estatParams)
    ? chart.estatParams
    : [chart.estatParams];
  if (
    componentType === 'stacked-area' &&
    (chart as DashboardConfigMap['stacked-area']).normalize
  )
    return [0, 100];
  return computeYAxisDomain({
    estatParams,
    areaCodes,
    yAxisConfig: chart.yAxisConfig,
    domainType:
      componentType === 'line-chart'
        ? 'minMax'
        : componentType === 'stacked-area'
          ? 'stackedMax'
          : 'symmetric',
  });
}
