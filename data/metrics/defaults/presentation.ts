import type { MetricPresentation } from '../../../packages/types/src/metric-presentation';
/** Shared authored defaults. Each metric may override its classification and numeric axes. */
export const DEFAULT_METRIC_PRESENTATION = {
  domain: { mode: 'extent' },
  classification: { method: 'equal-interval', classes: 5 },
  trendDomain: { mode: 'extent', padding: 0.08 },
  comparisonDomain: { mode: 'extent', padding: 0.05 },
} as const satisfies Pick<
  MetricPresentation,
  'domain' | 'classification' | 'trendDomain' | 'comparisonDomain'
>;
