import type { MetricPresentation } from './metric-presentation';

export interface ValueDisplayConfig {
  conversionFactor?: number;
  decimalPlaces?: number;
  displayUnit?: string;
}

/** Read compatibility for old snapshots. Authored definitions require the two numeric fields. */
export interface NormalizationDisplayOption {
  type: 'per_population' | 'per_area';
  label: string;
  unit: string;
  scaleFactor?: number;
  decimalPlaces?: number;
  visualization?: MetricPresentation;
}
export interface AuthoredNormalizationOption extends NormalizationDisplayOption {
  scaleFactor: number;
  decimalPlaces: number;
}
