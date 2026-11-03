import { describe, expect, it } from 'vitest';

import { buildMetricTableRows } from '../metric-table-rows';

import type { MetricKpi } from '../../components/metric-kpi';

function kpi(overrides: Partial<MetricKpi>): MetricKpi {
  return {
    metricKey: 'green-tea-consumption-expenditure',
    trendDomain: { mode: 'extent', padding: 0.08 },
    title: '緑茶への支出',
    unit: '円',
    yearName: '2025年',
    value: 2713,
    rank: 23,
    total: 47,
    precision: 0,
    series: [],
    isLoading: false,
    ...overrides,
  };
}

describe('buildMetricTableRows', () => {
  it('県のページは全国順位の列を持ち、全国の値がどの行にも無ければ全国の列を作らない', () => {
    const { extraHeaders, rows } = buildMetricTableRows([kpi({}), kpi({ metricKey: 'b', rank: 1 })], {}, true);
    expect(extraHeaders).toEqual(['全国順位']);
    expect(rows.map((row) => row.cells)).toEqual([['23位'], ['1位']]);
  });

  it('全国の値がある行があれば、全国の値と全国との差の列を足す', () => {
    const { extraHeaders, rows } = buildMetricTableRows([kpi({ nationalValue: 2000 }), kpi({ metricKey: 'b' })], {}, true);
    expect(extraHeaders).toEqual(['全国順位', '全国', '全国との差']);
    expect(rows[0].cells).toEqual(['23位', '2,000', '+36%']);
    expect(rows[1].cells).toEqual(['23位', '—', '—']);
  });

  it('全国のページは順位の列を持たず、値の無い指標は行にしない', () => {
    const { extraHeaders, rows } = buildMetricTableRows([kpi({ rank: null }), kpi({ metricKey: 'b', value: null })], {}, false);
    expect(extraHeaders).toEqual([]);
    expect(rows).toHaveLength(1);
  });
});
