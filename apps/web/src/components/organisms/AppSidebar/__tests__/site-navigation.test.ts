import { describe, expect, it } from 'vitest';

import {
  getActiveSidebarHref,
  HOME_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
} from '../site-navigation';

// サイドバーに並ぶ href の代表 (ホーム・主要ナビ (テーマ一覧を含む)・カテゴリ 2 件・テーマ 1 件)
const HREFS = [
  HOME_NAV_ITEM.href,
  ...PRIMARY_NAV_ITEMS.map((item) => item.href),
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
    // 地域単位は内容の中の切り口: 市区町村の比較は同じ内容の項目、市区町村ページは「地域」(2026-10-28)
    ['/municipalities', '/ranking'],
    ['/municipalities/ranking/example', '/ranking'],
    ['/municipalities/ranking/example/23000', '/ranking'],
    ['/municipalities/themes/population', '/themes'],
    ['/areas/37000/cities/37203', '/areas'],
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
