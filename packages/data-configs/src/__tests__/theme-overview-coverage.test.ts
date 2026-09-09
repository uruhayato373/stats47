import { describe, expect, it } from 'vitest';

import { THEME_INDICATOR_SETS } from '@stats47/types';

import { validateThemeOverviewCoverage } from '../../scripts/validate-theme-catalog';
import { listThemeCatalogs, type ThemeCatalog } from '../theme-catalog';

describe('全テーマの概況', () => {
  it('財政力指数と経常収支比率を別の縦軸のグラフで読める', () => {
    const catalog = listThemeCatalogs().find(
      (item) => item.key === 'local-finance'
    )!;
    const charts = catalog.charts.filter(
      (chart) => chart.componentType === 'line-chart'
    );
    expect(charts.map((chart) => chart.relatedRankingKeys)).toEqual([
      ['fiscal-strength-index-prefecture'],
      ['current-balance-ratio'],
    ]);
  });
  it('合計が100%でない割合を再正規化せず、単年・疎な系列は表に残す', () => {
    const catalog = (key: string) =>
      listThemeCatalogs().find((item) => item.key === key)!;
    expect(
      catalog('local-economy').charts.find(
        (chart) => chart.componentKey === 'theme-industry-structure'
      )?.componentType
    ).toBe('line-chart');
    expect(
      catalog('local-finance').charts.some(
        (chart) =>
          chart.componentType === 'composition-chart' ||
          chart.componentType === 'donut-chart'
      )
    ).toBe(false);
    expect(catalog('local-finance').overview?.comparisonRankingKeys).toContain(
      'local-tax-ratio-pref-finance'
    );
    expect(
      catalog('real-income').charts.find(
        (chart) => chart.componentKey === 'real-income-cpi-breakdown'
      )?.relatedRankingKeys
    ).toEqual(['consumer-price-difference-index-overall']);
    expect(
      catalog('living-housing').charts.find(
        (chart) => chart.componentKey === 'lh-dwelling-floor-area-trend'
      )?.relatedRankingKeys
    ).not.toContain('floor-area-per-dwelling-owner');
    expect(catalog('living-housing').overview?.comparisonRankingKeys).toContain(
      'floor-area-per-dwelling-owner'
    );
  });
  it('公開テーマを漏らさず、出典付きの指標をカード・地図・表に接続する', () => {
    const catalogs = listThemeCatalogs();
    const errors: string[] = [];
    validateThemeOverviewCoverage(
      catalogs,
      THEME_INDICATOR_SETS.map(({ key }) => key),
      errors
    );
    expect(errors).toEqual([]);
    for (const catalog of catalogs) {
      const overview = catalog.overview!;
      expect(overview.headlineRankingKeys.length).toBeGreaterThanOrEqual(1);
      expect(overview.headlineRankingKeys.length).toBeLessThanOrEqual(4);
      for (const key of overview.headlineRankingKeys)
        expect(overview.comparisonRankingKeys).toContain(key);
      for (const key of overview.comparisonRankingKeys) {
        const metric = catalog.metrics.find((item) => item.rankingKey === key);
        expect(metric?.selection?.sourceUrl).toMatch(/^https:\/\//);
        expect(overview.mapNotes[key]).toBeTruthy();
      }
    }
  });

  it('カタログ未登録と概況未定義を両方検知する', () => {
    const errors: string[] = [];
    validateThemeOverviewCoverage(
      [{ key: 'existing' } as ThemeCatalog],
      ['missing', 'existing'],
      errors
    );
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('missing');
    expect(errors[1]).toContain('existing');
  });

  it('単年の職業別給与・道路を折れ線にせず、比較表から読める', () => {
    for (const key of ['occupation-salary', 'roads']) {
      const catalog = listThemeCatalogs().find((item) => item.key === key)!;
      expect(catalog.overview?.comparisonRankingKeys.length).toBeGreaterThan(4);
      expect(
        catalog.charts.some((chart) => chart.componentType === 'line-chart')
      ).toBe(false);
    }
  });
});
