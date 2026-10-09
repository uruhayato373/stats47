import type { CanonicalColorScheme } from './color-scheme';
import { COLOR_SCHEME_CATALOG } from './color-scheme';

/** Authored limits use observation units, before display conversion. */
export type NumericDomainPolicy =
  | { mode: 'extent'; padding?: number }
  | { mode: 'zero'; padding?: number }
  | { mode: 'fixed'; min: number; max: number };

export type ColorClassification =
  | { method: 'continuous' }
  | { method: 'equal-interval' | 'quantile'; classes: number }
  | { method: 'threshold'; thresholds: number[] };

/** Shared by authored metrics and their generated R2 presentation metadata. */
export interface MetricPresentation {
  colorScheme: CanonicalColorScheme;
  colorSchemeType: 'sequential' | 'diverging';
  domain: NumericDomainPolicy;
  classification: ColorClassification;
  trendDomain: NumericDomainPolicy;
  comparisonDomain: NumericDomainPolicy;
  divergingMidpoint?: 'zero' | 'mean' | 'median' | 'custom';
  divergingMidpointValue?: number;
  isReversed?: boolean;
  isSymmetrized?: boolean;
}

/** Runtime snapshots use the same complete presentation contract as authored definitions. */
export function assertMetricPresentation(
  value: unknown
): asserts value is MetricPresentation {
  const record = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object' && !Array.isArray(v);
  if (!record(value)) throw new Error('Metric presentation must be an object');
  if (
    Object.keys(value).some(
      (k) =>
        ![
          'colorScheme',
          'colorSchemeType',
          'domain',
          'classification',
          'trendDomain',
          'comparisonDomain',
          'divergingMidpoint',
          'divergingMidpointValue',
          'isReversed',
          'isSymmetrized',
        ].includes(k)
    )
  )
    throw new Error('Unknown metric presentation field');
  const domain = (v: unknown) => {
    if (!record(v)) return false;
    if (v.mode === 'fixed')
      return (
        typeof v.min === 'number' &&
        typeof v.max === 'number' &&
        Number.isFinite(v.min) &&
        Number.isFinite(v.max) &&
        v.min < v.max &&
        Object.keys(v).every((k) => ['mode', 'min', 'max'].includes(k))
      );
    return (
      ['extent', 'zero'].includes(String(v.mode)) &&
      (v.padding === undefined ||
        (typeof v.padding === 'number' &&
          Number.isFinite(v.padding) &&
          v.padding >= 0)) &&
      Object.keys(v).every((k) => ['mode', 'padding'].includes(k))
    );
  };
  const scheme = COLOR_SCHEME_CATALOG.find(
    (s) => s.canonical === value.colorScheme
  );
  if (
    !scheme ||
    scheme.type !== value.colorSchemeType ||
    !['sequential', 'diverging'].includes(scheme.type)
  )
    throw new Error('Metric color scheme/type mismatch');
  if (
    !domain(value.trendDomain) ||
    !domain(value.comparisonDomain) ||
    !domain(value.domain)
  )
    throw new Error('Invalid metric numeric domain');
  const classification = value.classification;
  if (!record(classification)) throw new Error('Metric classification missing');
  const method = classification.method;
  if (method === 'continuous') {
    if (Object.keys(classification).length !== 1)
      throw new Error('Invalid continuous classification');
  } else if (method === 'equal-interval' || method === 'quantile') {
    if (
      !Number.isInteger(classification.classes) ||
      Number(classification.classes) < 2 ||
      Number(classification.classes) > 9 ||
      Object.keys(classification).some(
        (k) => !['method', 'classes'].includes(k)
      )
    )
      throw new Error('Metric classes must be 2–9');
  } else if (method === 'threshold') {
    const t = classification.thresholds;
    if (
      !Array.isArray(t) ||
      !t.length ||
      t.some(
        (v, i) =>
          typeof v !== 'number' ||
          !Number.isFinite(v) ||
          (i > 0 && v <= t[i - 1])
      ) ||
      Object.keys(classification).some(
        (k) => !['method', 'thresholds'].includes(k)
      )
    )
      throw new Error('Metric thresholds must increase');
  } else throw new Error('Unknown metric classification');
  if (
    value.colorSchemeType === 'sequential' &&
    ['divergingMidpoint', 'divergingMidpointValue', 'isSymmetrized'].some(
      (k) => value[k] !== undefined
    )
  )
    throw new Error('Diverging properties on sequential metric');
  if (
    value.divergingMidpoint !== undefined &&
    !['zero', 'mean', 'median', 'custom'].includes(
      String(value.divergingMidpoint)
    )
  )
    throw new Error('Invalid metric midpoint');
  if (
    value.divergingMidpoint === 'custom' &&
    (typeof value.divergingMidpointValue !== 'number' ||
      !Number.isFinite(value.divergingMidpointValue))
  )
    throw new Error('Custom metric midpoint missing');
  for (const k of ['isReversed', 'isSymmetrized'])
    if (value[k] !== undefined && typeof value[k] !== 'boolean')
      throw new Error('Invalid metric ' + k);
  if (
    value.colorSchemeType === 'diverging' &&
    record(value.domain) &&
    value.domain.mode === 'fixed' &&
    ['zero', 'custom'].includes(String(value.divergingMidpoint ?? 'zero'))
  ) {
    const midpoint =
      value.divergingMidpoint === 'custom'
        ? Number(value.divergingMidpointValue)
        : 0;
    if (
      midpoint < Number(value.domain.min) ||
      midpoint > Number(value.domain.max)
    )
      throw new Error('Fixed metric domain excludes midpoint');
    if (
      value.isSymmetrized &&
      Math.abs(
        (Number(value.domain.min) + Number(value.domain.max)) / 2 - midpoint
      ) > 1e-9
    )
      throw new Error('Fixed metric domain is not symmetric');
  }
}

/** A changed denominator has different units; authored raw limits cannot follow it. */
export function presentationForNormalizedValues(
  presentation: MetricPresentation
): MetricPresentation {
  const dynamic = (policy: NumericDomainPolicy): NumericDomainPolicy =>
    policy.mode === 'fixed' ? { mode: 'extent' } : policy;
  return {
    ...presentation,
    domain: dynamic(presentation.domain),
    comparisonDomain: dynamic(presentation.comparisonDomain),
    trendDomain: dynamic(presentation.trendDomain),
    classification:
      presentation.classification.method === 'threshold'
        ? { method: 'equal-interval', classes: 5 }
        : presentation.classification,
    divergingMidpoint:
      presentation.divergingMidpoint === 'custom'
        ? 'zero'
        : presentation.divergingMidpoint,
    divergingMidpointValue: undefined,
  };
}

/** Finite, present observations only; national aggregates belong to a separate series. */
export function summarizeNumericValues(
  values: readonly (number | null | undefined)[]
) {
  const sorted = values
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const count = sorted.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const mean = sorted.reduce((sum, value) => sum + value, 0) / count;
  const middle = Math.floor(count / 2);
  const median =
    count % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return { count, min, max, mean, median, sorted };
}

export function resolveNumericDomain(
  values: readonly (number | null | undefined)[],
  policy: NumericDomainPolicy
): [number, number] | null {
  const stats = summarizeNumericValues(values);
  if (!stats) return null;
  if (policy.mode === 'fixed') {
    if (
      !Number.isFinite(policy.min) ||
      !Number.isFinite(policy.max) ||
      policy.min >= policy.max
    )
      throw new Error('Invalid fixed numeric domain');
    return [policy.min, policy.max];
  }
  let min = policy.mode === 'zero' ? Math.min(0, stats.min) : stats.min;
  let max = policy.mode === 'zero' ? Math.max(0, stats.max) : stats.max;
  if (policy.mode === 'zero' && min === 0 && max === 0) return [0, 1];
  const span = max - min || Math.max(Math.abs(min) * 0.02, 1);
  if (min === max) {
    min -= span / 2;
    max += span / 2;
  }
  const padding = (policy.padding ?? 0) * span;
  if (!Number.isFinite(padding) || padding < 0)
    throw new Error('Invalid numeric domain padding');
  return [
    policy.mode === 'zero' && min === 0 ? 0 : min - padding,
    policy.mode === 'zero' && max === 0 ? 0 : max + padding,
  ];
}
