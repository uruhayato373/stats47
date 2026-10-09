import { describe, expect, it } from 'vitest';
import {
  assertMetricPresentation,
  presentationForNormalizedValues,
  resolveNumericDomain,
  summarizeNumericValues,
  type MetricPresentation,
} from '../metric-presentation';
const presentation: MetricPresentation = {
  domain: { mode: 'extent' },
  colorScheme: 'interpolateBlues',
  colorSchemeType: 'sequential',
  classification: { method: 'equal-interval', classes: 5 },
  trendDomain: { mode: 'extent', padding: 0.08 },
  comparisonDomain: { mode: 'extent', padding: 0.05 },
};
describe('Numeric observation and presentation contracts', () => {
  it('excludes missing and nonfinite values without treating them as zero', () => {
    expect(summarizeNumericValues([null, undefined, NaN, Infinity])).toBeNull();
    expect(summarizeNumericValues([-2, 0, 4, null, NaN])).toMatchObject({
      count: 3,
      min: -2,
      max: 4,
      mean: 2 / 3,
      median: 0,
    });
    expect(summarizeNumericValues([4, 2])).toMatchObject({ median: 3 });
  });
  it('supports honest extent, zero and fixed domains, including constant values', () => {
    expect(resolveNumericDomain([1625.6, 2309], { mode: 'extent' })).toEqual([
      1625.6, 2309,
    ]);
    expect(resolveNumericDomain([-10, 20], { mode: 'zero' })).toEqual([
      -10, 20,
    ]);
    expect(resolveNumericDomain([0, 0], { mode: 'zero' })).toEqual([0, 1]);
    expect(resolveNumericDomain([5, 5], { mode: 'extent' })).toEqual([
      4.5, 5.5,
    ]);
    expect(
      resolveNumericDomain([-10, 20], { mode: 'fixed', min: 0, max: 100 })
    ).toEqual([0, 100]);
    expect(() =>
      resolveNumericDomain([1], { mode: 'fixed', min: 1, max: 1 })
    ).toThrow();
  });
  it('rejects stale snapshots, unknown palettes and invalid classification policies', () => {
    expect(() => assertMetricPresentation(presentation)).not.toThrow();
    for (const bad of [
      undefined,
      {},
      { ...presentation, domain: undefined },
      { ...presentation, minValueType: 'data-min' },
      { ...presentation, preset: 'legacy' },
      { ...presentation, trendDomain: undefined },
      { ...presentation, legacy: true },
      { ...presentation, colorScheme: 'Blues' },
      { ...presentation, colorSchemeType: 'diverging' },
      { ...presentation, classification: { method: 'quantile', classes: 1 } },
      {
        ...presentation,
        classification: { method: 'threshold', thresholds: [2, 1] },
      },
      { ...presentation, comparisonDomain: { mode: 'extent', padding: NaN } },
    ])
      expect(() => assertMetricPresentation(bad)).toThrow();
  });
  it('does not carry raw unit thresholds or fixed ranges into denominator-based values', () => {
    const resolved = presentationForNormalizedValues({
      ...presentation,
      domain: { mode: 'fixed', min: 0, max: 1000 },
      trendDomain: { mode: 'fixed', min: 0, max: 1000 },
      classification: { method: 'threshold', thresholds: [100, 500] },
    });
    expect(resolved.domain).toEqual({ mode: 'extent' });
    expect(resolved.trendDomain).toEqual({ mode: 'extent' });
    expect(resolved.classification).toEqual({
      method: 'equal-interval',
      classes: 5,
    });
    expect(() => assertMetricPresentation(resolved)).not.toThrow();
  });
});
