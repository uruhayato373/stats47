import type { AuthoredPresentation } from '../../../packages/types/src/metric-presentation';
/** Shared authored defaults. Each metric may override its numeric axes. Colour steps come from the colour ledger. */
export const DEFAULT_METRIC_PRESENTATION = {
  domain: { mode: 'extent' },
  barDomain: { mode: 'extent' },
  trendDomain: { mode: 'extent', padding: 0.08 },
  comparisonDomain: { mode: 'extent', padding: 0.05 },
} as const satisfies Pick<AuthoredPresentation, 'domain' | 'trendDomain' | 'comparisonDomain' | 'barDomain'>;
