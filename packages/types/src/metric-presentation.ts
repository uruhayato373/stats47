import {
  assertColorClassification,
  type ColorClassification,
} from './color-classification';
import type { CanonicalColorScheme } from './color-scheme';
import { COLOR_SCHEME_CATALOG } from './color-scheme';
export type { ColorClassification } from './color-classification';

import {
  DEFAULT_BAR_DOMAIN,
  isNumericDomainPolicy,
  type NumericDomainPolicy,
  type BarDomainPolicy,
} from './numeric-domain';
export * from './numeric-domain';

/** Shared by authored metrics and their generated R2 presentation metadata. */
export interface MetricPresentation {
  colorScheme: CanonicalColorScheme;
  colorSchemeType: 'sequential' | 'diverging';
  domain: NumericDomainPolicy;
  classification: ColorClassification;
  trendDomain: NumericDomainPolicy;
  comparisonDomain: NumericDomainPolicy;
  /** Separate from the position-encoded comparison plot. Omission uses DEFAULT_BAR_DOMAIN. */
  barDomain?: BarDomainPolicy;
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
          'barDomain',
          'divergingMidpoint',
          'divergingMidpointValue',
          'isReversed',
          'isSymmetrized',
        ].includes(k)
    )
  )
    throw new Error('Unknown metric presentation field');

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
    !isNumericDomainPolicy(value.trendDomain) ||
    !isNumericDomainPolicy(value.comparisonDomain) ||
    !isNumericDomainPolicy(value.domain)
  )
    throw new Error('Invalid metric numeric domain');
  if (value.barDomain !== undefined) {
    if (!isNumericDomainPolicy(value.barDomain))
      throw new Error('Invalid metric bar domain');
  }
  assertColorClassification(value.classification);
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
    ...(presentation.barDomain
      ? {
          barDomain:
            presentation.barDomain.mode === 'fixed'
              ? DEFAULT_BAR_DOMAIN
              : presentation.barDomain,
        }
      : {}),
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

/** Convert presentation limits once when a renderer receives display-scaled observations. */
export function scaleMetricPresentation(
  presentation: MetricPresentation,
  factor: number
): MetricPresentation {
  if (!Number.isFinite(factor) || factor <= 0)
    throw new Error('Display factor must be positive and finite');
  const scale = (policy: NumericDomainPolicy): NumericDomainPolicy =>
    policy.mode === 'fixed'
      ? { ...policy, min: policy.min * factor, max: policy.max * factor }
      : policy;
  return {
    ...presentation,
    domain: scale(presentation.domain),
    trendDomain: scale(presentation.trendDomain),
    comparisonDomain: scale(presentation.comparisonDomain),
    ...(presentation.barDomain
      ? { barDomain: scale(presentation.barDomain) }
      : {}),
    classification:
      presentation.classification.method === 'threshold'
        ? {
            method: 'threshold',
            thresholds: presentation.classification.thresholds.map(
              (value) => value * factor
            ),
          }
        : presentation.classification,
    ...(presentation.divergingMidpointValue === undefined
      ? {}
      : {
          divergingMidpointValue: presentation.divergingMidpointValue * factor,
        }),
  };
}
