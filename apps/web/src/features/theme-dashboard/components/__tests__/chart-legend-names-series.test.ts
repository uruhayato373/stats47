import { describe, expect, it } from 'vitest';

import type { PageComponent } from '@/components/stat-charts';

import { chartLegendNamesSeries } from '../ThemeMetricsDashboard';


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
