import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PageComponent } from '@/components/stat-charts';

/**
 * 初回描画でサーバーが渡したデータがあるとき、指標カードと章の図は取りに行かない (2026-11-11)。
 *
 * 取りに行くと、表示のたびにページ URL への POST (Server Action) が出る。Google の描画もこれを出し、
 * クロール統計の「その他のファイル形式」に県×テーマのページが並んでいた (backlog `GSC-CRAWL-WASTE-01`)。
 * 県を切り替えた先の分は渡されていないので、従来どおり取りに行く。
 */

const { fetchTimeseries, loadChart } = vi.hoisted(() => ({
  fetchTimeseries: vi.fn(),
  loadChart: vi.fn(),
}));
vi.mock('../../lib/batched-metric-timeseries', () => ({
  fetchMetricTimeseriesBatched: (...args: unknown[]) => fetchTimeseries(...args),
}));
vi.mock('../../lib/batched-theme-chart-result', () => ({
  loadThemeChartResultBatched: (...args: unknown[]) => loadChart(...args),
}));
vi.mock('../ThemeChartResultRenderer', () => ({
  ThemeChartResultRenderer: () => <div data-testid="chart" />,
}));
vi.mock('@/components/charts/MiniCharts', () => ({
  MiniLineChart: ({ seriesName }: { seriesName: string }) => (
    <div data-testid="mini-line-chart" data-series-name={seriesName} />
  ),
}));

import { InitialThemeDataProvider } from '../InitialThemeDataContext';
import { SingleMetricCard } from '../SingleMetricCard';
import { ThemeDbChartRenderer } from '../ThemeDbChartRenderer';

import type { InitialThemeData } from '../../lib/initial-theme-data';
import type { MetricKpi } from '../metric-kpi';

const series = (source: 'area' | 'official') => ({
  points: [1, 2, 3, 4, 5].map((value, i) => ({ year: `${2020 + i}`, yearName: `${2020 + i}年`, value })),
  source,
});

const READY_CHART = {
  state: 'ready' as const,
  result: {
    type: 'line',
    data: { xAxisKey: 'year', data: [], lines: [], unit: '%' },
    contract: { unit: '%', year: '2024', seriesCount: 1 },
  },
};

const INITIAL = {
  areaCode: '24000',
  timeseries: { wage: { '24000': series('area'), '00000': series('official') } },
  chartResults: { 'fixture-line': READY_CHART },
} as unknown as InitialThemeData;

const METRIC: MetricKpi = {
  metricKey: 'wage',
  trendDomain: { mode: 'extent', padding: 0.08 },
  title: '賃金',
  unit: '円',
  value: 100,
  rank: null,
  total: 47,
  series: [],
  isLoading: false,
};

const CHART = {
  componentKey: 'fixture-line',
  componentType: 'line-chart',
  title: '推移',
  componentProps: {},
} as unknown as PageComponent;

describe('初回描画で渡されたテーマのデータ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchTimeseries.mockResolvedValue(series('area'));
    loadChart.mockResolvedValue(READY_CHART);
  });

  it('指標カードは、渡された県と全国の時系列で推移を描き、取りに行かない', () => {
    render(
      <InitialThemeDataProvider value={INITIAL}>
        <SingleMetricCard metric={METRIC} tabLabels={{}} selectedPrefectureCode="24000" areaName="三重県" />
      </InitialThemeDataProvider>
    );

    expect(screen.getByTestId('mini-line-chart')).toHaveAttribute('data-series-name', '三重県');
    expect(fetchTimeseries).not.toHaveBeenCalled();
  });

  it('指標カードは、渡されていない県の時系列は取りに行く', async () => {
    render(
      <InitialThemeDataProvider value={INITIAL}>
        <SingleMetricCard metric={METRIC} tabLabels={{}} selectedPrefectureCode="27000" areaName="大阪府" />
      </InitialThemeDataProvider>
    );

    await waitFor(() => expect(fetchTimeseries).toHaveBeenCalledWith('wage', '27000'));
    // 全国は渡された分を使う
    expect(fetchTimeseries).not.toHaveBeenCalledWith('wage', '00000');
  });

  it('章の図は、渡された結果を最初の描画から出し、取りに行かない', () => {
    render(
      <InitialThemeDataProvider value={INITIAL}>
        <ThemeDbChartRenderer chart={CHART} prefCode="24000" prefName="三重県" />
      </InitialThemeDataProvider>
    );

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(loadChart).not.toHaveBeenCalled();
  });

  it('章の図は、渡された結果と違う県では取りに行く', async () => {
    render(
      <InitialThemeDataProvider value={INITIAL}>
        <ThemeDbChartRenderer chart={CHART} prefCode="27000" prefName="大阪府" />
      </InitialThemeDataProvider>
    );

    await waitFor(() => expect(loadChart).toHaveBeenCalledWith(CHART, '27000'));
  });
});
