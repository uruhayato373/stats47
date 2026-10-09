// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { selectMetricDomainPolicy, metricSeriesDomain } from '@/lib/metric-presentation';

describe('theme domains from metric presentation', () => {
  it('preserves a single metric policy and uses the shared policy for several metrics', () => {
    const policy = { mode: 'fixed', min: 50, max: 100 } as const;
    expect(selectMetricDomainPolicy([policy])).toEqual(policy);
    expect(selectMetricDomainPolicy([policy, { mode: 'zero' }])).toEqual({ mode: 'extent', padding: 0.08 });
  });

  it('measures only the displayed series and keeps negative observations', () => {
    const rows = [{ shown: -20, singleYear: 10000 }, { shown: -10, singleYear: null }];
    expect(metricSeriesDomain(rows, ['shown'], { mode: 'extent', padding: 0.1 })).toEqual([-21, -9]);
  });

  it('uses zero for bar lengths but preserves an authored fixed domain', () => {
    const rows = [{ count: 40 }, { count: 50 }];
    expect(metricSeriesDomain(rows, ['count'], { mode: 'extent' }, true)).toEqual([0, 50]);
    expect(metricSeriesDomain(rows, ['count'], { mode: 'fixed', min: 0, max: 100 }, true)).toEqual([0, 100]);
    expect(() => metricSeriesDomain(rows, ['count'], { mode: 'fixed', min: 10, max: 100 }, true)).toThrow('include zero');
  });

  it('ignores missing and nonnumeric values without turning them into zero', () => {
    expect(metricSeriesDomain([{ a: null }, { a: '10' }, { a: NaN }], ['a'], { mode: 'extent' })).toBeUndefined();
    expect(metricSeriesDomain([{ a: 0 }], ['a'], { mode: 'zero' })).toEqual([0, 1]);
  });
});
