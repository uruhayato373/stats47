import {
  resolveNumericDomain,
  summarizeNumericValues,
  type NumericDomainPolicy,
  type NumericValue,
} from './numeric-domain';
import {
  assertColorClassification,
  type ColorClassification,
} from './color-classification';

export type DivergingMidpoint = 'zero' | 'mean' | 'median' | 'custom' | number;
export interface NumericColorEncoding {
  colorSchemeType?: 'sequential' | 'diverging';
  domain?: NumericDomainPolicy;
  classification?: ColorClassification;
  /** Compatibility for generic maps; authored metrics use domain. */
  minValueType?: 'zero' | 'data-min';
  divergingMidpoint?: DivergingMidpoint;
  divergingMidpointValue?: number;
  isSymmetrized?: boolean;
  isReversed?: boolean;
}

export function resolveColorMidpoint(
  values: readonly NumericValue[],
  kind: DivergingMidpoint = 'zero',
  custom?: number
): number {
  const stats = summarizeNumericValues(values);
  const midpoint =
    typeof kind === 'number'
      ? kind
      : kind === 'zero'
        ? 0
        : kind === 'custom'
          ? custom
          : kind === 'mean'
            ? stats?.mean
            : stats?.median;
  if (midpoint === undefined || !Number.isFinite(midpoint))
    throw new Error('Invalid choropleth midpoint');
  return midpoint;
}

/** Pure numerical color contract. The rendering adapter supplies the palette interpolator. */
export function resolveColorEncoding(
  config: NumericColorEncoding,
  values: readonly NumericValue[],
  interpolate: (position: number) => string,
  noDataColor: string
) {
  if (config.classification) assertColorClassification(config.classification);
  const stats = summarizeNumericValues(values);
  const empty = {
    domain: null,
    midpoint: undefined as number | undefined,
    boundaries: [] as number[],
    colors: [] as string[],
    colorAtValue: (_value: number) => noDataColor,
    noDataColor,
    method: 'continuous' as const,
  };
  if (!stats) return empty;
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
    midpoint = resolveColorMidpoint(
      values,
      kind,
      config.divergingMidpointValue
    );
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
  const scale = (value: number): string => {
    let position: number;
    if (midpoint === undefined)
      position = (value - domain[0]) / (domain[1] - domain[0]);
    else if (value === midpoint) position = 0.5;
    else if (value < midpoint)
      position =
        midpoint === domain[0]
          ? 0
          : (0.5 * (value - domain[0])) / (midpoint - domain[0]);
    else
      position =
        midpoint === domain[1]
          ? 1
          : 0.5 + (0.5 * (value - midpoint)) / (domain[1] - midpoint);
    position = Math.max(0, Math.min(1, position));
    return interpolate(config.isReversed ? 1 - position : position);
  };
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
  const lowerBins =
    midpoint === undefined
      ? 0
      : boundaries.slice(1).filter((value) => value <= midpoint).length;
  const upperBins =
    midpoint === undefined
      ? 0
      : boundaries.slice(0, -1).filter((value) => value >= midpoint).length;
  const binCount = boundaries.length - 1;
  const colors = boundaries.slice(0, -1).map((value, index) => {
    const upper = boundaries[index + 1];
    if (midpoint !== undefined && value < midpoint && upper > midpoint)
      return scale(midpoint);
    if (classification.method !== 'quantile') return scale((value + upper) / 2);
    // Quantile colors express class order: a long upper tail must not wash out lower classes.
    if (midpoint === undefined)
      return scale(
        domain[0] + ((domain[1] - domain[0]) * (index + 0.5)) / binCount
      );
    if (upper <= midpoint)
      return scale(
        domain[0] + ((midpoint - domain[0]) * (index + 0.5)) / lowerBins
      );
    return scale(
      midpoint +
        ((domain[1] - midpoint) * (index - (binCount - upperBins) + 0.5)) /
          upperBins
    );
  });
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
