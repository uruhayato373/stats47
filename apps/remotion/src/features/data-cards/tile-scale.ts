import * as d3chromatic from 'd3-scale-chromatic';
import {
  DEFAULT_SEQUENTIAL_SCHEME,
  d3KeyOfColorScheme,
  resolveColorEncoding,
  type NumericColorEncoding,
} from '@stats47/types';
import { createLegendFormatter } from '../../../../../packages/visualization/src/d3/utils/color-scale/legend-format';
import type { All47Scale } from './all47-svg';

/** Display settings shared by metric configs (`display`) and ranking items (`valueDisplay`). */
export interface TileValueDisplay {
  conversionFactor?: number;
  decimalPlaces?: number;
}

/**
 * Resolve the tile-map colours from a metric's authored visualization, synchronously so Remotion
 * slides can use it during render. Same encoding as the ranking page (resolveChoroplethScale);
 * only the palette lookup is static instead of a dynamic `import('d3')`.
 */
export function resolveTileScale(
  visualization: NumericColorEncoding & { colorScheme?: string | null },
  values: number[],
  display: TileValueDisplay = {}
): All47Scale | undefined {
  // item.json can carry a categorical scheme at runtime; tiles need an ordered numeric scale.
  if ((visualization.colorSchemeType as string | undefined) === 'categorical') return undefined;
  const scheme = visualization.colorScheme ?? (visualization.colorSchemeType === 'diverging' ? 'interpolateRdBu' : DEFAULT_SEQUENTIAL_SCHEME);
  const interpolate = (d3chromatic as unknown as Record<string, unknown>)[d3KeyOfColorScheme(scheme) ?? DEFAULT_SEQUENTIAL_SCHEME];
  if (typeof interpolate !== 'function') return undefined;
  const resolved = resolveColorEncoding(visualization, values, interpolate as (t: number) => string, '#e5e7eb');
  if (!resolved.domain) return undefined;
  const continuous = resolved.method === 'continuous';
  const midpoint = 'midpoint' in resolved ? resolved.midpoint : undefined;
  return {
    colorAt: resolved.colorAtValue,
    colors: continuous ? [] : resolved.colors,
    boundaries: continuous ? [...resolved.domain] : resolved.boundaries,
    formatBoundary: createLegendFormatter(
      [...resolved.boundaries, ...(midpoint === undefined ? [] : [midpoint])],
      display.conversionFactor ?? 1,
      resolved.method === 'threshold' ? undefined : display.decimalPlaces
    ),
  };
}
