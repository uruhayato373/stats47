import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PageComponent } from '@/components/stat-charts';

const { loadThemeChartResult } = vi.hoisted(() => ({
  loadThemeChartResult: vi.fn(),
}));

vi.mock('../theme-chart-result', () => ({
  loadThemeChartResult: (...args: unknown[]) => loadThemeChartResult(...args),
}));
vi.mock('../ThemeChartResultRenderer', () => ({
  ThemeChartResultRenderer: () => <div data-testid="chart" />,
}));

import { ThemeDbChartRenderer } from '../ThemeDbChartRenderer';

const CHART = {
  componentKey: 'fixture-line',
  componentType: 'line-chart',
  title: '推移',
  componentProps: {},
} as unknown as PageComponent;

describe('ThemeDbChartRenderer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('全国行の代替値には47都道府県平均であることを近接表示する', async () => {
    loadThemeChartResult.mockResolvedValue({
      state: 'ready',
      result: {
        type: 'line',
        data: { xAxisKey: 'year', data: [], lines: [], unit: '%' },
        contract: {
          unit: '%',
          year: '2024',
          seriesCount: 1,
          scopeLabel: '47都道府県平均',
        },
      },
    });

    render(<ThemeDbChartRenderer chart={CHART} prefCode="00000" prefName="全国" />);

    expect(
      await screen.findByText('表示値は全国値ではなく、47都道府県の単純平均です。'),
    ).toBeInTheDocument();
  });

  it('チャート固有のempty messageを表示する', async () => {
    loadThemeChartResult.mockResolvedValue({
      state: 'no-data',
      message: '都道府県を選択してください。',
    });

    render(<ThemeDbChartRenderer chart={CHART} prefCode="00000" prefName="全国" />);

    expect(await screen.findByText('都道府県を選択してください。')).toBeInTheDocument();
  });
});
