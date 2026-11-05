import * as d3chromatic from 'd3-scale-chromatic';
import { applyColorPolicy } from '../../../../../packages/types/src/color-policy';
import {
  DEFAULT_SEQUENTIAL_SCHEME,
  d3KeyOfColorScheme,
  metricHueOf,
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
  metricEncoding: NumericColorEncoding & { colorScheme?: string | null },
  values: number[],
  display: TileValueDisplay = {}
): All47Scale | undefined {
  const visualization = applyColorPolicy(metricEncoding, values);
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

/** Position on the metric's scheme used for one-colour marks: dark enough for text on paper. */
const STRONG_T = 0.85;

/**
 * The metric's own colour for one-colour figures (bar charts, value text): the strong end of its
 * sequential scheme, so a metric's bars and its map share one hue. Maps and tiles shade by value
 * instead; bars already encode the value by length, so they use this single colour.
 * Diverging and non-hue schemes have no single colour and return undefined (the figure's default).
 */
export function resolveMetricColor(visualization: { colorScheme?: string | null; colorSchemeType?: string | null }) {
  if (visualization.colorSchemeType === 'diverging' || !metricHueOf(visualization.colorScheme)) return undefined;
  const interpolate = (d3chromatic as unknown as Record<string, unknown>)[d3KeyOfColorScheme(visualization.colorScheme) ?? ''];
  return typeof interpolate === 'function' ? (interpolate as (t: number) => string)(STRONG_T) : undefined;
}
