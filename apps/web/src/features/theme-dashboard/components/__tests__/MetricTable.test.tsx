import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MetricTable } from '../MetricTable';

import type { MetricKpi } from '../metric-kpi';

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

describe('MetricTable', () => {
  it('県のページはこの地域の 1 行ずつに値と全国順位を並べ、順位は文字のまま書く', () => {
    render(
      <MetricTable
        title="お茶"
        metrics={[kpi({}), kpi({ metricKey: 'black-tea', title: '紅茶への支出', value: 1856, rank: 1 })]}
        tabLabels={{}}
        selectedPrefectureCode="28000"
      />
    );
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('1位')).toBeInTheDocument();
    // 全国の値がどの行にも無いので、全国・全国との差の列を出さない
    expect(screen.queryByRole('columnheader', { name: '全国' })).not.toBeInTheDocument();
  });

  it('全国の値がある行があれば、全国との差を割合で出す', () => {
    render(
      <MetricTable
        metrics={[kpi({ nationalValue: 2000 })]}
        tabLabels={{}}
        selectedPrefectureCode="28000"
      />
    );
    expect(screen.getByRole('columnheader', { name: '全国との差' })).toBeInTheDocument();
    expect(screen.getByText('+36%')).toBeInTheDocument();
  });
});
