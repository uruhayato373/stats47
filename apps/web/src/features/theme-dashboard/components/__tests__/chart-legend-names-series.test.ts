import { describe, expect, it } from 'vitest';

import type { PageComponent } from '@/components/stat-charts';

import { chartDuplicatesMetrics, chartLegendNamesSeries } from '../ThemeMetricsDashboard';


/**
 * 章の中のチャートの題名の帯を外す条件 (2026-10-29 オーナー決定)。凡例が系列の名前を示すチャートだけが対象で、
 * 凡例の無いチャートで帯を外すと何のチャートか分からなくなる。
 */
const chart = (componentType: string, componentProps: Record<string, unknown>) =>
  ({ componentKey: 'k', componentType, title: 't', componentProps }) as unknown as PageComponent;

const refs = (n: number) => Array.from({ length: n }, (_, i) => ({ metricKey: `m${i}` }));

describe('chartLegendNamesSeries', () => {
  it('系列が 2 本以上の折れ線は凡例が名前を示す', () => {
    expect(chartLegendNamesSeries(chart('line-chart', { seriesRefs: refs(2) }))).toBe(true);
  });

  it('棒と折れ線は棒と線の系列を合わせて数える', () => {
    expect(chartLegendNamesSeries(chart('mixed-chart', { columnSeriesRefs: refs(1), lineSeriesRefs: refs(1) }))).toBe(true);
  });

  it('1 系列の折れ線は凡例が出ないので対象外', () => {
    expect(chartLegendNamesSeries(chart('line-chart', { seriesRefs: refs(1) }))).toBe(false);
  });

  it('凡例の形が違う種類 (物価・構成比など) は系列が多くても対象外', () => {
    expect(chartLegendNamesSeries(chart('cpi-profile', { seriesRefs: refs(10) }))).toBe(false);
    expect(chartLegendNamesSeries(chart('composition-chart', { seriesRefs: refs(4) }))).toBe(false);
  });
});

/**
 * 章のチャートが切り替えカードと同じ指標だけを描くか (2026-10-29 オーナー決定)。一致する章ではチャートをやめ、
 * カードの系列を選べるグラフを出す。一致しない図 (全国の系列・指標が多い・別の種類) を消すと情報が減るので残す。
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
  it('折れ線以外の種類は重複ではない', () => {
    expect(chartDuplicatesMetrics(chart('mixed-chart', { columnSeriesRefs: [{ metricKey: 'vacant' }], lineSeriesRefs: [{ metricKey: 'owner' }] }), keys)).toBe(false);
  });
});
