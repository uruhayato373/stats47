import { describe, expect, it } from 'vitest';

import { THEME_INDICATOR_SETS } from '@stats47/types';

import {
  LOCAL_FINANCE_RATIO_METRICS,
  listThemeCatalogs,
} from '../theme-catalog';

const catalog = (key: string) =>
  listThemeCatalogs().find((item) => item.key === key)!;

describe('テーマ比較と既存章の統合', () => {
  it('財政指標は専用章で表示し、財政力指数と百分率の定義を分離する', () => {
    expect(
      catalog('local-finance').sections?.find(
        (section) => section.key === 'fiscal-capacity'
      )?.embeddedSectionKeys
    ).toContain('finance-sustainability');
    expect(
      LOCAL_FINANCE_RATIO_METRICS.find(
        (metric) => metric.rankingKey === 'fiscal-strength-index-prefecture'
      )?.unit
    ).toBe('');
    expect(
      LOCAL_FINANCE_RATIO_METRICS.find(
        (metric) => metric.rankingKey === 'current-balance-ratio'
      )?.unit
    ).toBe('%');
    expect(
      catalog('local-finance').charts.some((chart) =>
        chart.relatedRankingKeys?.some((key) =>
          [
            'fiscal-strength-index-prefecture',
            'current-balance-ratio',
          ].includes(key)
        )
      )
    ).toBe(false);
  });

  it('合計が100%でない産業割合を再正規化せず元の系列として渡す', () => {
    const chart = catalog('local-economy').charts.find(
      (item) => item.componentKey === 'theme-industry-structure'
    )!;
    expect(chart.componentType).toBe('line-chart');
    expect(chart.componentProps.seriesRefs).toEqual([
      {
        metricKey: 'employed-people-ratio-primary',
        label: '第1次産業就業者比率',
        colorRole: 'improve',
      },
      {
        metricKey: 'employed-people-ratio-secondary',
        label: '第2次産業就業者比率',
        colorRole: 'population',
      },
      {
        metricKey: 'employed-people-ratio-tertiary',
        label: '第3次産業就業者比率',
        colorRole: 'series-12',
      },
    ]);
    expect(chart.sourceLink).toBe('https://www.stat.go.jp/data/ssds/index.htm');
    expect(chart.annotation).toContain('100%');
  });

  it('総合物価と費目系列を分け、住宅面積の疎な系列も失わない', () => {
    expect(
      catalog('real-income').charts.find(
        (chart) => chart.componentKey === 'real-income-cpi-breakdown'
      )?.relatedRankingKeys
    ).toEqual(['consumer-price-difference-index-overall']);
    expect(
      catalog('living-housing').charts.find(
        (chart) => chart.componentKey === 'lh-dwelling-floor-area-trend'
      )?.relatedRankingKeys
    ).toContain('floor-area-per-dwelling-owner');
  });

  it('全55カタログの既存指標・章・生成先を保持し、別のoverview定義を必須にしない', () => {
    const catalogs = listThemeCatalogs();
    expect(catalogs).toHaveLength(55);
    const generatedKeys = new Set(THEME_INDICATOR_SETS.map((item) => item.key));
    for (const item of catalogs) {
      expect(generatedKeys.has(item.key), item.key).toBe(true);
      const keys = new Set(item.metrics.map((metric) => metric.rankingKey));
      for (const group of item.metricGroups ?? []) {
        for (const key of group.rankingKeys)
          expect(keys.has(key), `${item.key}/${key}`).toBe(true);
      }
    }
    expect(catalog('population-dynamics').sections?.length).toBeGreaterThan(0);
    expect(
      catalog('local-finance').sections?.some(
        (section) => section.embeddedSectionKeys?.length
      )
    ).toBe(true);
  });
});
