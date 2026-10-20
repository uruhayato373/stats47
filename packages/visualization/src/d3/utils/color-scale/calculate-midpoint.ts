import { resolveColorMidpoint, type DivergingMidpoint } from '@stats47/types';
import type { VisualizationDataPoint, D3Module } from '../../types';

/** Compatibility entry point. Numeric midpoint calculation has no D3 dependency. */
export function calculateMidpoint(data: VisualizationDataPoint[], kind: DivergingMidpoint, custom: number | undefined, _d3?: D3Module): number {
  return resolveColorMidpoint(data.map(point => point.value), kind, custom);
}
