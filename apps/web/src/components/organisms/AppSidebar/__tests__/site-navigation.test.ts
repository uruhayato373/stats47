import { describe, expect, it } from 'vitest';

import {
  getActiveSidebarHref,
  HOME_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
  REGION_NAV_ITEMS,
} from '../site-navigation';

// サイドバーに並ぶ href の代表 (ホーム・主要ナビ (テーマ一覧を含む)・カテゴリ 2 件・テーマ 1 件)
const HREFS = [
  HOME_NAV_ITEM.href,
  ...PRIMARY_NAV_ITEMS.map((item) => item.href).filter((href) => href !== '/areas'),
  ...REGION_NAV_ITEMS.map((item) => item.href),
  '/category/laborwage',
  '/category/population',
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
    // 地域間比較はサイドバーに置かないので、そのカテゴリの項目を現在地にする
    ['/category/population/compare', '/category/population'],
    ['/areas', '/areas'],
    ['/areas/13000', '/areas'],
    // 地域の 3 段 (全国・都道府県・市区町村) をメニューに出した (2026-10-31 オーナー決定)。
    // 市区町村の比較・市区町村のページ・県内の市区町村の比較は「市区町村」、全国のテーマは「全国」
    ['/municipalities', '/municipalities'],
    ['/municipalities/ranking/example', '/municipalities'],
    ['/municipalities/ranking/example/23000', '/municipalities'],
    ['/municipalities/themes/population-dynamics', '/municipalities'],
    ['/areas/37000/cities/37203', '/municipalities'],
    ['/areas/37000/cities/37203/labor-wages', '/municipalities'],
    ['/areas/28000/labor-wages/cities', '/municipalities'],
    ['/areas/28000/labor-wages', '/areas'],
    ['/japan', '/japan'],
    ['/japan/labor-wages', '/japan'],
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
