import { describe, expect, it } from 'vitest';
import {
  resolveChartDomain,
  resolveSeriesDomain,
  selectNumericDomainPolicy,
  stackedNumericValues,
  resolveSymmetricDomain,
  scaleNumericDomain,
  isYAxisConfig,
  resolveObservationDomain,
} from '../index';
import { scaleMetricPresentation } from '../metric-presentation';
import type { MetricPresentation, StatsSchema } from '../index';
describe('shared numeric domain contracts', () => {
  it('never invents a zero observation from absent or non-finite values', () => {
    expect(
      resolveChartDomain([null, undefined, NaN, Infinity], { mode: 'zero' })
    ).toBeNull();
    expect(
      resolveSeriesDomain([{ x: null }, { x: '12' }], ['x'], { mode: 'extent' })
    ).toBeUndefined();
    expect(resolveChartDomain([-20, -10], { mode: 'zero' })).toEqual([-20, 0]);
    expect(resolveChartDomain([5, 5], { mode: 'extent' })).toEqual([4.5, 5.5]);
  });
  it('uses resolved limits unchanged and rejects actual clipping', () => {
    expect(
      resolveChartDomain([28.4, 36.2], { mode: 'zero' }, [28.4, 36.2])
    ).toEqual([28.4, 36.2]);
    expect(() =>
      resolveChartDomain([20], { mode: 'fixed', min: 0, max: 10 })
    ).toThrow('excludes');
    expect(() =>
      resolveChartDomain([5], { mode: 'fixed', min: 0, max: 10 }, [0, 20])
    ).toThrow('conflicts');
    expect(() =>
      resolveChartDomain([], { mode: 'fixed', min: 1, max: 1 })
    ).toThrow();
    expect(
      resolveChartDomain([100 + Number.EPSILON * 100], {
        mode: 'fixed',
        min: 0,
        max: 100,
      })
    ).toEqual([0, 100]);
  });
  it('keeps positive/negative totals separate and ignores wholly empty rows', () => {
    expect(
      stackedNumericValues(
        [{ a: 10, b: -9, c: 20 }, { a: null }],
        ['a', 'b', 'c']
      )
    ).toEqual([-9, 30]);
    expect(resolveSymmetricDomain([-40, 10])).toEqual([-40, 40]);
    const rows = [10, -9, 20].map((value, i) => ({
      metricKey: String(i),
      areaCode: '01',
      yearCode: '2024',
      value,
    })) as StatsSchema[];
    expect(
      resolveObservationDomain(rows, { mode: 'extent' }, 'stackedMax')
    ).toEqual([-9, 30]);
  });
  it('keeps identical multi-metric policies and refuses conflicting settings', () => {
    const fixed = { mode: 'fixed', min: 0, max: 100 } as const;
    expect(
      selectNumericDomainPolicy([fixed, { ...fixed }], { mode: 'extent' })
    ).toEqual(fixed);
    expect(() =>
      selectNumericDomainPolicy([fixed, { mode: 'zero' }], { mode: 'extent' })
    ).toThrow('Conflicting');
    expect(isYAxisConfig({ mode: 'fixed' })).toBe(false);
    expect(isYAxisConfig({ mode: 'auto', domain: [0, 1] })).toBe(false);
    expect(isYAxisConfig({ mode: 'fixed', domain: [0, 1] })).toBe(true);
  });
  it('converts values, limits, thresholds and custom midpoint in the same unit', () => {
    const presentation: MetricPresentation = {
      colorScheme: 'interpolateRdBu',
      colorSchemeType: 'diverging',
      domain: { mode: 'fixed', min: -1000, max: 2000 },
      classification: { method: 'threshold', thresholds: [0, 1000] },
      trendDomain: { mode: 'fixed', min: 0, max: 2000 },
      comparisonDomain: { mode: 'extent' },
      divergingMidpoint: 'custom',
      divergingMidpointValue: 500,
    };
    const scaled = scaleMetricPresentation(presentation, 0.001);
    expect(scaled.domain).toEqual({ mode: 'fixed', min: -1, max: 2 });
    expect(scaled.classification).toEqual({
      method: 'threshold',
      thresholds: [0, 1],
    });
    expect(scaled.divergingMidpointValue).toBe(0.5);
    expect(scaleNumericDomain([0, 2000], 0.001)).toEqual([0, 2]);
    expect(resolveChartDomain([0.5, 1], scaled.trendDomain)).toEqual([0, 2]);
    expect(presentation.divergingMidpointValue).toBe(500);
  });
});
