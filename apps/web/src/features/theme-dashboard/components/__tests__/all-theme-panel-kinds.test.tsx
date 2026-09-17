import {
  THEME_CATALOGS,
  type ThemeCatalog,
} from '@stats47/data-configs/theme-catalog';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * ThemeMetricsDashboard の件数契約 (2026-09-17) を、実カタログ (THEME_CATALOGS) 全件で固定する。
 *
 * metrics-dashboard-switcher.test.tsx / MetricSwitcherPanel.test.tsx / SingleMetricCard.test.tsx は
 * 合成データで契約の細部 (取得・軸・退避表記など) を見る。ここは「実際の 55 テーマの
 * metricGroups 編成を渡したとき、comparisonYear/rankingKeys 件数どおりのパネル種別が
 * 定義順どおりに現れるか」だけを見る回帰テスト (件数リテラルは書かない。テーマの追加・削除に
 * 追従する)。
 */

vi.mock('../MetricSwitcherPanel', () => ({
  MetricSwitcherPanel: ({
    metrics,
  }: {
    metrics: { metricKey: string }[];
  }) => (
    <div
      data-testid="switcher-panel"
      data-keys={metrics.map((m) => m.metricKey).join(',')}
    />
  ),
}));
vi.mock('../SingleMetricCard', () => ({
  SingleMetricCard: ({ metric }: { metric: { metricKey: string } }) => (
    <div data-testid="single-card" data-keys={metric.metricKey} />
  ),
}));
vi.mock('../FixedYearComparisonPanel', () => ({
  FixedYearComparisonPanel: ({
    metrics,
  }: {
    metrics: { metricKey: string }[];
  }) => (
    <div
      data-testid="fixed-year-panel"
      data-keys={metrics.map((m) => m.metricKey).join(',')}
    />
  ),
}));
vi.mock('../ThemeDbChartRenderer', () => ({
  ThemeDbChartRenderer: () => <div />,
}));
vi.mock('../ThemeComparisonSection', () => ({
  ThemeComparisonSection: () => null,
}));

import { ALL_THEMES } from '../../config/all-themes';
import { ThemeMetricsDashboard } from '../ThemeMetricsDashboard';

import type { ThemeConfig, ThemeIndicatorData } from '../../types';

/** KPI に採用されるには MIN_VALUES_FOR_KPI (=10) 以上の観測が要る */
function indicatorData(key: string, valueCount = 12): ThemeIndicatorData {
  return {
    rankingItem: { title: key, unit: '単位' },
    rankingValues: Array.from({ length: valueCount }, (_, i) => ({
      areaCode: String(i + 1).padStart(5, '0'),
      value: 100 + i,
      rank: i + 1,
    })),
    nationalSeries: [],
  } as unknown as ThemeIndicatorData;
}

/** カタログが参照する全 rankingKey (metrics ∪ metricGroups) に十分な観測を与える */
function buildIndicatorDataMap(
  catalog: ThemeCatalog
): Record<string, ThemeIndicatorData> {
  const keys = new Set<string>();
  for (const metric of catalog.metrics) keys.add(metric.rankingKey);
  for (const group of catalog.metricGroups ?? []) {
    for (const key of group.rankingKeys) keys.add(key);
  }
  const map: Record<string, ThemeIndicatorData> = {};
  for (const key of keys) map[key] = indicatorData(key);
  return map;
}

/** metricGroups 未定義テーマは非 context 指標を 1 グループへ倒す (ThemeMetricsDashboard のフォールバックと同じ規則) */
function expectedGroups(catalog: ThemeCatalog, themeConfig: ThemeConfig) {
  if (catalog.metricGroups && catalog.metricGroups.length > 0) {
    return catalog.metricGroups.map((g) => ({
      key: g.key,
      rankingKeys: g.rankingKeys,
      comparisonYear: g.comparisonYear,
    }));
  }
  return [
    {
      key: 'default',
      rankingKeys: themeConfig.tabIndicators.map((t) => t.rankingKey),
      comparisonYear: undefined as string | undefined,
    },
  ];
}

describe('ALL_THEMES', () => {
  it('1 テーマ以上が登録されている (55 等の件数リテラルはここに書かない)', () => {
    expect(ALL_THEMES.length).toBeGreaterThan(0);
  });
});

describe.each(ALL_THEMES.map((theme) => [theme.themeKey, theme] as const))(
  'ThemeMetricsDashboard — 実カタログのパネル種別 (%s)',
  (themeKey, themeConfig) => {
    const catalog = THEME_CATALOGS[themeKey];

    it('comparisonYear/rankingKeys 件数どおりのパネル種別が、定義順どおりに現れる', () => {
      expect(catalog).toBeDefined();
      const indicatorDataMap = buildIndicatorDataMap(catalog);

      const { container } = render(
        <ThemeMetricsDashboard
          themeConfig={themeConfig}
          metricGroups={catalog.metricGroups}
          sections={catalog.sections}
          indicatorDataMap={indicatorDataMap}
          selectedPrefectureCode={null}
        />
      );

      const groups = expectedGroups(catalog, themeConfig);
      const rendered = [...container.querySelectorAll('[data-testid]')];

      expect(rendered).toHaveLength(groups.length);
      rendered.forEach((el, i) => {
        const group = groups[i];
        const expectedKind = group.comparisonYear
          ? 'fixed-year-panel'
          : group.rankingKeys.length === 1
            ? 'single-card'
            : 'switcher-panel';
        expect(el.getAttribute('data-testid')).toBe(expectedKind);
        expect(el.getAttribute('data-keys')).toBe(group.rankingKeys.join(','));
      });
    });
  }
);

describe('ThemeMetricsDashboard — 観測不足での降格 (実カタログ)', () => {
  const degradableEntry = Object.entries(THEME_CATALOGS).find(([, catalog]) =>
    (catalog.metricGroups ?? []).some(
      (g) => !g.comparisonYear && g.rankingKeys.length === 2
    )
  );

  it('グループ内の生存キーを 1 件に減らすと single-card になる', () => {
    expect(degradableEntry).toBeDefined();
    const [themeKey, catalog] = degradableEntry!;
    const group = catalog.metricGroups!.find(
      (g) => !g.comparisonYear && g.rankingKeys.length === 2
    )!;
    const themeConfig = ALL_THEMES.find((t) => t.themeKey === themeKey);
    expect(themeConfig).toBeDefined();

    const indicatorDataMap = buildIndicatorDataMap(catalog);
    const survivorKey = group.rankingKeys[0];
    const weakKey = group.rankingKeys[1];
    // MIN_VALUES_FOR_KPI (=10) 未満に減らして観測不足で落とす
    indicatorDataMap[weakKey] = indicatorData(weakKey, 3);

    render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig!}
        metricGroups={catalog.metricGroups}
        sections={catalog.sections}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={null}
      />
    );

    const survivor = screen
      .getAllByTestId('single-card')
      .find((el) => el.getAttribute('data-keys') === survivorKey);
    expect(survivor).toBeDefined();
    const stillMulti = screen
      .queryAllByTestId('switcher-panel')
      .find((el) => (el.getAttribute('data-keys') ?? '').includes(weakKey));
    expect(stillMulti).toBeUndefined();
  });
});
