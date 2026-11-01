import { describe, expect, it } from 'vitest';

import type { PageComponent } from '@/components/stat-charts';

import { chartDuplicatesMetrics } from '../ThemeMetricsDashboard';


const chart = (componentType: string, componentProps: Record<string, unknown>) =>
  ({ componentKey: 'k', componentType, title: 't', componentProps }) as unknown as PageComponent;

const refs = (n: number) => Array.from({ length: n }, (_, i) => ({ metricKey: `m${i}` }));

/**
 * 章のチャートがカードと同じ指標だけを描くか (2026-10-29 オーナー決定。2026-11-01 から 1 指標のカードも)。一致する章では
 * チャートをやめ、カードのグラフを出す (同じ値を 2 か所に出さない)。一致しない図 (全国の系列・指標が多い・別の種類) を消すと情報が減るので残す。
 */
describe('chartDuplicatesMetrics', () => {
  const keys = ['vacant', 'owner'];
  it('同じ指標の集合だけを描く折れ線は重複', () => {
    expect(chartDuplicatesMetrics(chart('line-chart', { seriesRefs: [{ metricKey: 'owner' }, { metricKey: 'vacant' }] }), keys)).toBe(true);
  });
  it('全国の系列を含む図は重複ではない (カードのグラフは全国を重ねない場合がある)', () => {
    expect(
      chartDuplicatesMetrics(chart('line-chart', { seriesRefs: [{ metricKey: 'vacant' }, { metricKey: 'owner', area: 'national' }] }), keys)
    ).toBe(false);
  });
  it('指標が多い・少ない図は重複ではない', () => {
    expect(chartDuplicatesMetrics(chart('line-chart', { seriesRefs: refs(3) }), ['m0', 'm1'])).toBe(false);
    expect(chartDuplicatesMetrics(chart('line-chart', { seriesRefs: [{ metricKey: 'vacant' }] }), keys)).toBe(false);
  });
  it('1 指標のカードと、その指標だけの線 1 本の図も重複', () => {
    expect(chartDuplicatesMetrics(chart('line-chart', { seriesRefs: [{ metricKey: 'vacant' }] }), ['vacant'])).toBe(true);
  });
  it('折れ線以外の種類は重複ではない', () => {
    expect(chartDuplicatesMetrics(chart('mixed-chart', { columnSeriesRefs: [{ metricKey: 'vacant' }], lineSeriesRefs: [{ metricKey: 'owner' }] }), keys)).toBe(false);
  });
});
