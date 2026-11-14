// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { ALL_THEMES } from '../../config/all-themes';
import { THEME_NAV_GROUPS } from '../../config/theme-navigation';
import { groupThemesForListing } from '../group-themes-for-listing';

/**
 * テーマの一覧 (/themes・/municipalities) は、サイドバーと同じ 5 分野で分けて並べる (HUB-LIST-FINDABILITY-01)。
 * 一覧が分類なしの同形カードだと目的のテーマを探せないため、分類と並び順をサイドバーの正本 (THEME_NAV_GROUPS) から作る。
 */
describe('groupThemesForListing', () => {
  it('全テーマを分野ごとに 1 回ずつ、サイドバーと同じ分野順・同じテーマ順で並べる', () => {
    const groups = groupThemesForListing(ALL_THEMES);

    expect(groups.map((group) => group.id)).toEqual(THEME_NAV_GROUPS.map((group) => group.id));
    for (const group of groups) {
      const navGroup = THEME_NAV_GROUPS.find((item) => item.id === group.id);
      expect(group.label).toBe(navGroup?.label);
      expect(group.themes.map((theme) => theme.themeKey)).toEqual(
        navGroup?.themeKeys.filter((key) => ALL_THEMES.some((theme) => theme.themeKey === key)),
      );
    }
    const listed = groups.flatMap((group) => group.themes.map((theme) => theme.themeKey));
    expect(listed).toHaveLength(ALL_THEMES.length);
    expect(new Set(listed).size).toBe(ALL_THEMES.length);
  });

  it('どの分野にも無いテーマは捨てずに「その他」の分野へ入れ、空の分野は出さない', () => {
    const groups = groupThemesForListing([
      { themeKey: 'unknown-theme' },
      { themeKey: 'aging-society' },
      { themeKey: 'population-dynamics' },
    ]);

    expect(groups).toEqual([
      {
        id: 'population-life',
        label: '人口・暮らし',
        themes: [{ themeKey: 'population-dynamics' }, { themeKey: 'aging-society' }],
      },
      { id: 'other', label: 'その他', themes: [{ themeKey: 'unknown-theme' }] },
    ]);
  });
});
