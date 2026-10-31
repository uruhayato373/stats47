import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PageComponent } from '@/components/stat-charts';

const { loadThemeChartResult } = vi.hoisted(() => ({
  loadThemeChartResult: vi.fn(),
}));

vi.mock('../../lib/batched-theme-chart-result', () => ({
  loadThemeChartResultBatched: (...args: unknown[]) => loadThemeChartResult(...args),
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

  // 47 県の平均を全国として見せない (2026-11-01 オーナー決定)。包むカードは印を見て自分ごと隠れる
  it('全国のページで 47 都道府県の平均しか描けない図は描かず、隠す印だけを置く', async () => {
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

    const { container } = render(<ThemeDbChartRenderer chart={CHART} prefCode="00000" prefName="全国" />);

    await waitFor(() => expect(container.querySelector('[data-national-average-hidden]')).not.toBeNull());
    expect(screen.queryByText(/単純平均/)).toBeNull();
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
