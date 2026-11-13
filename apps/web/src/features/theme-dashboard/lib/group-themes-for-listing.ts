import { THEME_NAV_GROUPS } from '../config/theme-navigation';

/** どの分野 (THEME_NAV_GROUPS) にも無いテーマを入れる分野。テーマを一覧から落とさないための受け皿 */
const OTHER_GROUP = { id: 'other', label: 'その他' } as const;

export interface ThemeListingGroup<T> {
  id: string;
  label: string;
  themes: T[];
}

/**
 * テーマの一覧を、サイドバーと同じ分野 (THEME_NAV_GROUPS) に分ける (HUB-LIST-FINDABILITY-01)。
 * 分野の順と分野の中のテーマの順はサイドバーと同じ。テーマの無い分野は出さない。
 */
export function groupThemesForListing<T extends { themeKey: string }>(
  themes: readonly T[],
): ThemeListingGroup<T>[] {
  const byKey = new Map(themes.map((theme) => [theme.themeKey, theme]));
  const placed = new Set<string>();
  const groups: ThemeListingGroup<T>[] = THEME_NAV_GROUPS.map((group) => {
    const members = group.themeKeys.flatMap((key) => {
      const theme = byKey.get(key);
      if (!theme || placed.has(key)) return [];
      placed.add(key);
      return [theme];
    });
    return { id: group.id, label: group.label, themes: members };
  });
  const others = themes.filter((theme) => !placed.has(theme.themeKey));
  return [...groups, { ...OTHER_GROUP, themes: others }].filter((group) => group.themes.length > 0);
}
