import { describe, expect, it } from 'vitest';

import { getActiveHeaderNav } from '../header-navigation';

describe('getActiveHeaderNav', () => {
  it.each([
    ['/ranking', 'ranking'],
    ['/ranking/annual-income', 'ranking'],
    ['/category', 'category'],
    ['/category/laborwage', 'category'],
    ['/areas', 'areas'],
    ['/areas/13000', 'areas'],
    ['/municipalities', 'municipalities'],
    ['/municipalities/ranking/example', 'municipalities'],
    ['/themes', 'themes'],
    ['/themes/population-dynamics', 'themes'],
    ['/geo', 'geo'],
    ['/geo/population-flood-risk', 'geo'],
    ['/blog', 'blog'],
    ['/blog/population-change', 'blog'],
  ] as const)('%s は %s だけをアクティブにする', (pathname, expected) => {
    expect(getActiveHeaderNav(pathname)).toBe(expected);
  });

  it.each([
    '/',
    '/search',
    '/rankings',
    '/category-other',
    '/areas-old',
    '/themes-old',
    '/geography',
    '/blogger',
  ])('%s は主要ナビをアクティブにしない', (pathname) => {
    expect(getActiveHeaderNav(pathname)).toBeNull();
  });
});
