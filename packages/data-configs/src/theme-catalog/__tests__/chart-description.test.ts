import { describe, expect, it } from 'vitest';

import {
  validateChartContentContract,
  validateChartIndicatorHubContract,
  validateIndicatorHubContentCompleteness,
} from '../../../scripts/validate-theme-catalog';
import { THEME_CATALOGS } from '../index';
import {
  catalogToPageComponentsJson,
  isGenericChartDescription,
} from '../transform';

import type { CatalogChart, ThemeCatalog } from '../types';

const chart: CatalogChart = {
  componentKey: 'reader-guide-test',
  componentType: 'line-chart',
  title: '人口の推移',
  componentProps: {},
  sortOrder: 0,
};

function catalog(chartOverrides: Partial<CatalogChart> = {}): ThemeCatalog {
  return {
    key: 'test-theme',
    title: 'テスト',
    description: 'テスト',
    category: 'demographics',
    usage: 'theme',
    metrics: [
      {
        rankingKey: 'total-population',
        shortLabel: '総人口',
        role: 'secondary',
      },
      {
        rankingKey: 'ratio-65-plus',
        shortLabel: '高齢者割合',
        role: 'secondary',
      },
    ],
    charts: [{ ...chart, ...chartOverrides }],
  } as ThemeCatalog;
}

function pageComponent(c: ThemeCatalog): Record<string, unknown> {
  const rows = JSON.parse(catalogToPageComponentsJson(c)) as Array<
    Record<string, unknown>
  >;
  return rows[0] ?? {};
}

describe('theme chart content contract', () => {
  it('チャート説明を自動生成せず、互換フィールドを常に null にする', () => {
    expect(pageComponent(catalog()).description).toBeNull();
  });

  it('型を迂回して残った CatalogChart.description を拒否する', () => {
    const legacy = {
      ...chart,
      description: '2020年に調査方法が変わっています。',
    } as unknown as CatalogChart;
    const errors: string[] = [];
    validateChartContentContract(
      legacy,
      'test-theme/reader-guide-test',
      errors
    );
    expect(errors).toEqual([
      expect.stringContaining('[chart-description-legacy]'),
    ]);
    expect(pageComponent(catalog(legacy)).description).toBeNull();
  });

  it('旧 generator の定型説明を生成物側でも検出できる', () => {
    const description =
      '人口の推移を年ごとに示します。線の傾きと系列間の差から、増減の方向と変化の大きさを確認できます。';
    expect(isGenericChartDescription(description)).toBe(true);

    const errors: string[] = [];
    validateChartContentContract(
      { ...chart, description } as unknown as CatalogChart,
      'test-theme/reader-guide-test',
      errors
    );
    expect(errors).toEqual([
      expect.stringContaining('[chart-description-boilerplate]'),
    ]);
  });

  it('可視化固有 annotation を既存 componentProps 契約へ移す', () => {
    const row = pageComponent(
      catalog({
        annotation: '2019年以前と2024年は調査時点が異なります。',
      })
    );
    expect(row.componentProps).toMatchObject({
      annotation: '2019年以前と2024年は調査時点が異なります。',
    });
  });

  it('空 annotation と二重定義を拒否する', () => {
    const emptyErrors: string[] = [];
    validateChartContentContract(
      { ...chart, annotation: '  ' },
      'test-theme/reader-guide-test',
      emptyErrors
    );
    expect(emptyErrors).toEqual([
      expect.stringContaining('[chart-annotation]'),
    ]);

    const duplicateErrors: string[] = [];
    validateChartContentContract(
      {
        ...chart,
        annotation: '調査時点が異なります。',
        componentProps: { annotation: '旧注釈' },
      },
      'test-theme/reader-guide-test',
      duplicateErrors
    );
    expect(duplicateErrors).toEqual([expect.stringContaining('二重定義')]);
  });
});

describe('theme chart indicator-hub links', () => {
  it('relatedRankingKeys の先頭を主 rankingLink へ生成する', () => {
    const row = pageComponent(
      catalog({ relatedRankingKeys: ['total-population'] })
    );
    expect(row.rankingLink).toBe('/ranking/total-population');
    expect(row.componentProps).not.toHaveProperty('rankingLinks');
  });

  it('2件目以降を短縮ラベル付き追加導線へ生成する', () => {
    const row = pageComponent(
      catalog({
        relatedRankingKeys: ['total-population', 'ratio-65-plus'],
      })
    );
    expect(row.rankingLink).toBe('/ranking/total-population');
    expect(row.componentProps).toMatchObject({
      rankingLinks: [
        {
          label: '高齢者割合の定義・ランキング',
          url: '/ranking/ratio-65-plus',
        },
      ],
    });
  });

  it('自由記述 rankingLink / rankingLinks の残存を拒否する', () => {
    const errors: string[] = [];
    const legacy = {
      ...chart,
      relatedRankingKeys: ['total-population'],
      rankingLink: '/ranking/total-population',
      componentProps: {
        rankingLinks: [{ label: '旧リンク', url: '/ranking/ratio-65-plus' }],
      },
    } as unknown as CatalogChart;
    validateChartIndicatorHubContract(
      legacy,
      'test-theme/reader-guide-test',
      errors,
      []
    );
    expect(errors).toEqual([
      expect.stringContaining('[ranking-link-legacy]'),
      expect.stringContaining('[ranking-links-legacy]'),
    ]);
  });

  it('markdown以外の未紐付けを error にし、markdown は除外する', () => {
    const errors: string[] = [];
    validateChartIndicatorHubContract(
      chart,
      'test-theme/reader-guide-test',
      errors,
      []
    );
    expect(errors).toEqual([
      expect.stringContaining('[indicator-hub-missing]'),
    ]);

    const markdownErrors: string[] = [];
    validateChartIndicatorHubContract(
      { ...chart, componentType: 'markdown-section' },
      'test-theme/markdown',
      markdownErrors,
      []
    );
    expect(markdownErrors).toEqual([]);
  });

  it('重複・不在の relatedRankingKeys を配信前に拒否する', () => {
    const errors: string[] = [];
    validateChartIndicatorHubContract(
      {
        ...chart,
        relatedRankingKeys: [
          'total-population',
          'total-population',
          'not-a-metric',
        ],
      },
      'test-theme/reader-guide-test',
      errors,
      []
    );
    expect(errors).toEqual([
      expect.stringContaining('[related-key-duplicate]'),
      expect.stringContaining('METRICS_REGISTRY に不在'),
    ]);
  });

  it('全83 data-bound componentがテーマ内指標へ紐付く', () => {
    const dataBound = Object.values(THEME_CATALOGS).flatMap((theme) =>
      theme.charts
        .filter((item) => item.componentType !== 'markdown-section')
        .map((item) => ({ theme, item }))
    );
    expect(dataBound).toHaveLength(83);
    for (const { theme, item } of dataBound) {
      const metricKeys = new Set(
        theme.metrics.map((metric) => metric.rankingKey)
      );
      expect(
        item.relatedRankingKeys?.length,
        item.componentKey
      ).toBeGreaterThan(0);
      for (const key of item.relatedRankingKeys ?? []) {
        expect(
          metricKeys.has(key),
          `${theme.key}/${item.componentKey}: ${key}`
        ).toBe(true);
      }
    }
  });

  it('135指標ハブの説明欠落を112件のratchetとして可視化する', () => {
    const errors: string[] = [];
    const warns: string[] = [];
    const coverage = validateIndicatorHubContentCompleteness(
      Object.values(THEME_CATALOGS),
      errors,
      warns
    );
    expect(coverage.totalKeys).toBe(135);
    expect(coverage.missingDescriptionKeys).toHaveLength(112);
    expect(coverage.authoredNoteKeys).toHaveLength(1);
    expect(errors).toEqual([]);
    expect(warns).toEqual([expect.stringContaining('descriptionMissing=112')]);
  });
});
