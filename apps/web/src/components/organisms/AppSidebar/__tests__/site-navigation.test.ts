import { describe, expect, it } from 'vitest';

import {
  ALL_THEMES_NAV_ITEM,
  COMPARE_NAV_ITEM,
  getActiveSidebarHref,
  HOME_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
} from '../site-navigation';

// サイドバーに並ぶ href の代表 (主要ナビ・ホーム・比較・テーマ一覧・カテゴリ 1 件・テーマ 1 件)
const HREFS = [
  HOME_NAV_ITEM.href,
  ...PRIMARY_NAV_ITEMS.map((item) => item.href),
  COMPARE_NAV_ITEM.href,
  '/category/laborwage',
  '/category/population',
  ALL_THEMES_NAV_ITEM.href,
  '/themes/population-dynamics',
];

describe('getActiveSidebarHref', () => {
  it.each([
    ['/', '/'],
    ['/ranking', '/ranking'],
    ['/ranking/annual-income', '/ranking'],
    ['/ranking/', '/ranking'],
    ['/category/laborwage', '/category/laborwage'],
    ['/category/laborwage/sub', '/category/laborwage'],
    ['/category/population/compare', '/category/population/compare'],
    ['/areas', '/areas'],
    ['/areas/13000', '/areas'],
    ['/municipalities', '/municipalities'],
    ['/municipalities/ranking/example', '/municipalities'],
    ['/areas/37000/cities/37203', '/municipalities'],
    ['/themes', '/themes'],
    ['/themes/population-dynamics', '/themes/population-dynamics'],
    ['/themes/other-theme', '/themes'],
    ['/geo', '/geo'],
    ['/geo/population-flood-risk', '/geo'],
    ['/blog', '/blog'],
    ['/blog/population-change', '/blog'],
  ] as const)('%s は %s だけを現在地にする', (pathname, expected) => {
    expect(getActiveSidebarHref(pathname, HREFS)).toBe(expected);
  });

  it.each([
    '/search',
    '/rankings',
    '/category',
    '/category-other',
    '/areas-old',
    '/themes-old',
    '/geography',
    '/blogger',
  ])('%s はどの項目も現在地にしない', (pathname) => {
    expect(getActiveSidebarHref(pathname, HREFS)).toBeNull();
  });

  it('カテゴリをランキングの別名として扱わない', () => {
    expect(getActiveSidebarHref('/category/laborwage', HREFS)).not.toBe('/ranking');
  });
});
