// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PageComponent } from '@/components/stat-charts';

const { batchAction, loadChart } = vi.hoisted(() => ({ batchAction: vi.fn(), loadChart: vi.fn() }));
vi.mock('../../actions/fetch-metric-timeseries', () => ({
  fetchMetricTimeseriesBatchAction: (...args: unknown[]) => batchAction(...args),
}));
vi.mock('../theme-chart-result', () => ({
  loadThemeChartResult: (...args: unknown[]) => loadChart(...args),
}));

import { loadInitialThemeData } from '../initial-theme-data';

const chart = (componentKey: string, componentType = 'line-chart') =>
  ({ componentKey, componentType, componentProps: {} }) as unknown as PageComponent;

describe('loadInitialThemeData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    batchAction.mockImplementation(async (requests: { rankingKey: string; areaCode: string }[]) =>
      requests.map((r) => ({ points: [], source: `${r.rankingKey}@${r.areaCode}` }))
    );
    loadChart.mockResolvedValue({ state: 'no-data' });
  });

  it('県のページは、指標ごとに県と全国の時系列を読む', async () => {
    const data = await loadInitialThemeData({ metricKeys: ['a', 'b'], charts: [], prefectureCode: '24000' });

    expect(data.areaCode).toBe('24000');
    expect(data.timeseries.a['24000'].source).toBe('a@24000');
    expect(data.timeseries.b['00000'].source).toBe('b@00000');
  });

  it('全国のページは時系列を読まない (指標カードが取りに行かないため) が、図は全国で解決する', async () => {
    const data = await loadInitialThemeData({ metricKeys: ['a'], charts: [chart('c1')], prefectureCode: null });

    expect(batchAction).not.toHaveBeenCalled();
    expect(data.timeseries).toEqual({});
    expect(loadChart).toHaveBeenCalledWith(expect.objectContaining({ componentKey: 'c1' }), '00000');
    expect(data.chartResults.c1).toEqual({ state: 'no-data' });
  });

  it('Server Action の上限 (60 件) を超える要求は分けて読む', async () => {
    const metricKeys = Array.from({ length: 40 }, (_, i) => `m${i}`);

    const data = await loadInitialThemeData({ metricKeys, charts: [], prefectureCode: '24000' });

    expect(batchAction.mock.calls.map(([requests]) => requests.length)).toEqual([60, 20]);
    expect(Object.keys(data.timeseries)).toHaveLength(40);
  });

  it('取得できなかった図と markdown は渡さない (クライアントが従来どおり取りに行く)', async () => {
    loadChart.mockImplementation(async (c: PageComponent) =>
      c.componentKey === 'broken' ? { state: 'source-unavailable' } : { state: 'no-data' }
    );

    const data = await loadInitialThemeData({
      metricKeys: [],
      charts: [chart('ok'), chart('broken'), chart('text', 'markdown-section')],
      prefectureCode: '24000',
    });

    expect(Object.keys(data.chartResults)).toEqual(['ok']);
  });

  it('時系列の読み込みが失敗しても描画を止めず、空で返す', async () => {
    batchAction.mockRejectedValue(new Error('R2'));

    const data = await loadInitialThemeData({ metricKeys: ['a'], charts: [], prefectureCode: '24000' });

    expect(data.timeseries).toEqual({});
  });
});
