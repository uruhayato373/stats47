import { resolveNumericDomain, summarizeNumericValues } from '@stats47/types';
import { createColorScale } from './create-color-scale';
import { mapConfigToColorOptions } from '../convert-map-config';
import { DEFAULT_PREFECTURE_MAP_PROPS } from '../../constants/map-constants';
import type {
  MapDataPoint,
  MapVisualizationConfig,
} from '../../types/map-chart';

/** Map fills and the legend resolve exactly the same domain, thresholds and colors. */
export async function resolveChoroplethScale(
  config: MapVisualizationConfig,
  data: MapDataPoint[]
) {
  const stats = summarizeNumericValues(data.map((point) => point.value));
  const noDataColor =
    config.noDataColor ?? DEFAULT_PREFECTURE_MAP_PROPS.noDataFillColor;
  const options = mapConfigToColorOptions(
    config,
    data.filter((point) => Number.isFinite(point.value))
  );
  const empty = {
    domain: null,
    boundaries: [] as number[],
    colors: [] as string[],
    colorAtValue: (_value: number) => noDataColor,
    noDataColor,
    method: 'continuous' as const,
  };
  if (!stats) return empty;
  if (config.colorSchemeType === 'categorical') {
    const colorAtValue = await createColorScale(options);
    return { ...empty, colorAtValue };
  }
  const fallback = {
    mode:
      config.colorSchemeType === 'sequential' && config.minValueType === 'zero'
        ? ('zero' as const)
        : ('extent' as const),
  };
  const domain = resolveNumericDomain(stats.sorted, config.domain ?? fallback);
  if (!domain) return empty;
  let midpoint: number | undefined;
  if (config.colorSchemeType === 'diverging') {
    const kind = config.divergingMidpoint ?? 'zero';
    midpoint =
      typeof kind === 'number'
        ? kind
        : kind === 'mean'
          ? stats.mean
          : kind === 'median'
            ? stats.median
            : kind === 'custom'
              ? config.divergingMidpointValue
              : 0;
    if (midpoint === undefined || !Number.isFinite(midpoint))
      throw new Error('Invalid choropleth midpoint');
    // A diverging axis always includes its declared reference, even if all observations have one sign.
    if (config.domain?.mode === 'fixed') {
      if (midpoint < domain[0] || midpoint > domain[1])
        throw new Error('Fixed choropleth domain excludes midpoint');
      if (
        config.isSymmetrized &&
        Math.abs((domain[0] + domain[1]) / 2 - midpoint) > 1e-9
      )
        throw new Error('Fixed choropleth domain is not symmetric');
    } else {
      domain[0] = Math.min(domain[0], midpoint);
      domain[1] = Math.max(domain[1], midpoint);
    }
    if (config.isSymmetrized && config.domain?.mode !== 'fixed') {
      const radius = Math.max(
        Math.abs(domain[0] - midpoint),
        Math.abs(domain[1] - midpoint)
      );
      domain[0] = midpoint - radius;
      domain[1] = midpoint + radius;
    }
  }
  const scale = await createColorScale({
    ...options,
    resolvedDomain: domain,
    ...(options.type === 'diverging'
      ? {
          divergingMidpoint: 'custom' as const,
          divergingMidpointValue: midpoint,
          isSymmetrized: false,
        }
      : {}),
  });
  const classification = config.classification ?? {
    method: 'continuous' as const,
  };
  let thresholds: number[] = [];
  if (classification.method === 'equal-interval')
    thresholds = Array.from(
      { length: classification.classes - 1 },
      (_, i) =>
        domain[0] + ((domain[1] - domain[0]) * (i + 1)) / classification.classes
    );
  else if (classification.method === 'quantile') {
    thresholds = Array.from({ length: classification.classes - 1 }, (_, i) => {
      const position = ((stats.count - 1) * (i + 1)) / classification.classes;
      const low = Math.floor(position);
      return (
        stats.sorted[low] +
        (stats.sorted[Math.min(low + 1, stats.count - 1)] - stats.sorted[low]) *
          (position - low)
      );
    });
  } else if (classification.method === 'threshold')
    thresholds = classification.thresholds;
  thresholds = [...new Set(thresholds)]
    .filter((value) => value > domain[0] && value < domain[1])
    .sort((a, b) => a - b);
  const boundaries = [domain[0], ...thresholds, domain[1]];
  const colors = boundaries
    .slice(0, -1)
    .map((value, i) =>
      scale(
        midpoint !== undefined &&
          value < midpoint &&
          boundaries[i + 1] > midpoint
          ? midpoint
          : (value + boundaries[i + 1]) / 2
      )
    );
  const colorAtValue = (value: number) => {
    if (!Number.isFinite(value)) return noDataColor;
    if (classification.method === 'continuous') return scale(value);
    if (value === midpoint) return scale(value);
    return colors[thresholds.filter((threshold) => value >= threshold).length];
  };
  return {
    domain,
    midpoint,
    boundaries,
    colors,
    colorAtValue,
    noDataColor,
    method: classification.method,
  };
}
