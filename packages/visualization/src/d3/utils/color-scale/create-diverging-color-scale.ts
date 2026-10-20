import { resolveColorEncoding } from '@stats47/types';
import { resolveColorInterpolator } from './create-color-schemes';
import { DEFAULT_PREFECTURE_MAP_PROPS } from '../../constants/map-constants';
import type { DivergingColorScaleOptions } from '../../types';

export async function createDivergingColorScale(options: DivergingColorScaleOptions): Promise<(value: number) => string> {
  const d3 = options.d3 ?? await import('d3');
  const domain = options.resolvedDomain;
  const interpolate = resolveColorInterpolator(d3, options.colorScheme ?? 'interpolateRdBu');
  return resolveColorEncoding({
    ...options,
    colorSchemeType: 'diverging',
    ...(domain ? {domain: {mode: 'fixed', min: domain[0], max: domain[1]} as const} : {}),
  }, options.data.map(point => point.value), interpolate, options.noDataColor ?? DEFAULT_PREFECTURE_MAP_PROPS.noDataFillColor).colorAtValue;
}
