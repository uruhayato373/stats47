import "server-only";

import { listThemeCatalogs, listThemesUsingRankingKeys } from "@stats47/data-configs/theme-catalog";

import { KNOWN_THEME_SLUGS } from "@/config/known-theme-slugs";

export interface RelatedThemeLink {
  themeKey: string;
  title: string;
  href: string;
}

/**
 * 渡した指標を主指標・副指標として使う公開テーマ。ランキング・ブログ・エリアから
 * 「この指標を深掘りするテーマ」へ回遊する (逆引きの規則は listThemesUsingRankingKeys)。
 * `/themes/<key>` が公開されていないカタログは出さない (KNOWN_THEME_SLUGS)。
 */
export function listRelatedThemesForRankingKeys(
  rankingKeys: readonly string[],
  options: { excludeThemeKey?: string; limit?: number } = {},
): RelatedThemeLink[] {
  if (rankingKeys.length === 0) return [];
  return listThemesUsingRankingKeys(rankingKeys, listThemeCatalogs())
    .filter((theme) => KNOWN_THEME_SLUGS.has(theme.key) && theme.key !== options.excludeThemeKey)
    .slice(0, options.limit ?? Number.POSITIVE_INFINITY)
    .map((theme) => ({ themeKey: theme.key, title: theme.title, href: `/themes/${theme.key}` }));
}
