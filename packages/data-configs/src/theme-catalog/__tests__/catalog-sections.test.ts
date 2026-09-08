import { describe, expect, it } from 'vitest';

import { validateCatalogSections } from '../catalog-sections';
import { THEME_CATALOGS } from '../index';
import type { ThemeCatalog } from '../types';

function example(): ThemeCatalog {
  return {
    key: 'example', title: '例', description: '例', category: 'economy', usage: 'theme',
    metrics: [{ rankingKey: 'example-metric', role: 'primary', shortLabel: '例' }],
    metricGroups: [{ key: 'level', title: '水準', rankingKeys: ['example-metric'], defaultCheckedKeys: ['example-metric'] }],
    charts: [{ componentKey: 'example-chart', title: '推移', componentType: 'line-chart', componentProps: {}, sortOrder: 0 }],
    sections: [{ key: 'level', title: '水準はどう変わるか', metricGroupKeys: ['level'], chartKeys: ['example-chart'] }],
  };
}

describe('問い別の章の参照契約', () => {
  it('全テーマに章があり、全カードと図が一度ずつ配置される', () => {
    for (const catalog of Object.values(THEME_CATALOGS)) {
      expect(validateCatalogSections(catalog), catalog.key).toEqual([]);
    }
    expect(THEME_CATALOGS.climate).toBeDefined();
  });
  it('存在しない参照と、章を消したことで生じる脱落を検出する', () => {
    const catalog = example();
    catalog.sections![0].chartKeys = ['missing'];
    expect(validateCatalogSections(catalog)).toEqual(expect.arrayContaining([
      expect.stringContaining('[section-reference]'),
      expect.stringContaining('[section-unassigned]'),
    ]));
  });
  it('同じ図・カード・埋め込みの二重配置を検出する', () => {
    const catalog = example();
    catalog.sections![0].embeddedSectionKeys = ['map'];
    catalog.sections!.push({ ...catalog.sections![0], key: 'duplicate' });
    expect(validateCatalogSections(catalog).filter((message) => message.includes('[section-duplicate]'))).toHaveLength(3);
  });
  it('空の章と、章のないテーマを受け入れない', () => {
    const catalog = example();
    catalog.sections!.push({ key: 'empty', title: '参考', metricGroupKeys: [] });
    expect(validateCatalogSections(catalog)).toContainEqual(expect.stringContaining('[section-empty]'));
    delete catalog.sections;
    expect(validateCatalogSections(catalog)).toContainEqual(expect.stringContaining('[section-missing]'));
  });
});
