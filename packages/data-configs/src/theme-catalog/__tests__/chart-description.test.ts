import { describe, expect, it } from 'vitest';

import {
  catalogToPageComponentsJson,
  resolveChartDescription,
} from '../transform';

import type { CatalogChart, ThemeCatalog } from '../types';

const chart: CatalogChart = {
  componentKey: 'reader-guide-test',
  componentType: 'line-chart',
  title: '人口の推移',
  componentProps: {},
  sortOrder: 0,
};

describe('theme chart reader description', () => {
  it('未指定のチャートにも種類別の読者向け説明を補う', () => {
    expect(resolveChartDescription(chart)).toContain('線の傾き');
  });

  it('カタログの個別説明を優先する', () => {
    expect(
      resolveChartDescription({ ...chart, description: '個別の読み方です。' })
    ).toBe('個別の読み方です。');
  });

  it('配信JSONへdescriptionを必ず出力する', () => {
    const catalog = {
      key: 'test-theme',
      title: 'テスト',
      description: 'テスト',
      category: 'demographics',
      usage: 'theme',
      metrics: [],
      charts: [chart],
    } as ThemeCatalog;
    const rows = JSON.parse(catalogToPageComponentsJson(catalog)) as Array<{
      description: string | null;
    }>;

    expect(rows[0]?.description).toContain('年ごと');
  });
});
