import { resolveColorEncoding } from '@stats47/types';
import { createColorScale } from './create-color-scale';
import { resolveColorInterpolator } from './create-color-schemes';
import { mapConfigToColorOptions } from '../convert-map-config';
import { DEFAULT_PREFECTURE_MAP_PROPS } from '../../constants/map-constants';
import type { MapDataPoint, MapVisualizationConfig } from '../../types/map-chart';

/** Palette loading is renderer-specific; domain, classes and legend share one pure resolver. */
export async function resolveChoroplethScale(config: MapVisualizationConfig, data: MapDataPoint[]) {
  const noDataColor = config.noDataColor ?? DEFAULT_PREFECTURE_MAP_PROPS.noDataFillColor;
  if (config.colorSchemeType === 'categorical') {
    const colorAtValue = await createColorScale(mapConfigToColorOptions(config, data));
    return { domain: null, boundaries: [] as number[], colors: [] as string[], colorAtValue, noDataColor, method: 'continuous' as const };
  }
  const d3 = await import('d3');
  const interpolate = resolveColorInterpolator(d3, config.colorScheme ?? (config.colorSchemeType === 'diverging' ? 'interpolateRdBu' : 'interpolateBlues'));
  return resolveColorEncoding(config, data.map(point => point.value), interpolate, noDataColor);
}
