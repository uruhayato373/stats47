import { ALL_THEMES } from "./all-themes";

import type { ThemeConfig } from "../types";

/**
 * 正典 URL が `/themes/{themeKey}` ではないテーマ (サブページ配信) の写像。
 *
 * `local-finance-city` は bespoke な市区町村財政ページ `/themes/local-finance/cities`
 * で配信される。動的ルート `[themeSlug]` は `/themes/local-finance-city` も解決して
 * しまう (重複コンテンツ) ため、middleware で正典 URL へ 301 統合し、内部リンク
 * (ヘッダー / テーマ一覧 / テーマ切替 / sitemap) は最初から正典 URL を指す。
 */
const THEME_CANONICAL_HREF: Record<string, string> = {
  "local-finance-city": "/themes/local-finance/cities",
};

/** テーマの正典 URL を返す。既定は `/themes/{themeKey}`。 */
export function themeHref(themeKey: string): string {
  return THEME_CANONICAL_HREF[themeKey] ?? `/themes/${themeKey}`;
}

/**
 * グローバルナビ (ヘッダーメガメニュー / モバイルドロワー) に単独項目として
 * 出さないテーマ。`local-finance-city` は `local-finance` の市区町村ビューであり、
 * 財政テーマページ内の 都道府県/市区町村 トグルで到達するため除外する。
 * (テーマ一覧 `/themes` は discovery 面なので除外せず canonical href で残す)
 */
const NAV_HIDDEN_THEME_KEYS: ReadonlySet<string> = new Set([
  "local-finance-city",
]);

/** グローバルナビに出すテーマ一覧 (ALL_THEMES を SSOT に導出)。 */
export const NAV_THEMES: ThemeConfig[] = ALL_THEMES.filter(
  (t) => !NAV_HIDDEN_THEME_KEYS.has(t.themeKey),
);
