import { describe, expect, it } from 'vitest';

import { ALL_THEMES } from '../all-themes';
import { THEME_NAV_GROUPS } from '../theme-navigation';

describe('THEME_NAV_GROUPS', () => {
  it('ALL_THEMESの全テーマを重複なく1回だけ含む', () => {
    const groupedKeys = THEME_NAV_GROUPS.flatMap((group) => group.themeKeys);
    const uniqueKeys = new Set(groupedKeys);
    const allThemeKeys = ALL_THEMES.map((theme) => theme.themeKey);

    expect(groupedKeys).toHaveLength(uniqueKeys.size);
    expect([...uniqueKeys].sort()).toEqual([...allThemeKeys].sort());
  });

  it('グループIDと表示名が重複しない', () => {
    const ids = THEME_NAV_GROUPS.map((group) => group.id);
    const labels = THEME_NAV_GROUPS.map((group) => group.label);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
