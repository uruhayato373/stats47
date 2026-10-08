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

  // 2026-10-06: 同じ3指標の折れ線 (theme-industry-structure) はカードと重複するため外した。
  // 図の注記にあった「合計は100%にならない」は、カードを置く章の説明へ移している。
  it('合計が100%でない産業割合を再正規化せず元の系列として渡す', () => {
    const economy = catalog('local-economy');
    expect(
      economy.metricGroups?.find((group) => group.key === 'industry-1')
        ?.rankingKeys
    ).toEqual([
      'employed-people-ratio-primary',
      'employed-people-ratio-secondary',
      'employed-people-ratio-tertiary',
    ]);
    const industry = economy.sections?.find(
      (section) => section.key === 'industry'
    );
    expect(industry?.metricGroupKeys).toContain('industry-1');
    expect(industry?.description).toContain('合計は100%になりません');
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

  it('全56カタログの既存指標・章・生成先を保持し、別のoverview定義を必須にしない', () => {
    const catalogs = listThemeCatalogs();
    expect(catalogs).toHaveLength(56);
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
