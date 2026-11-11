/**
 * 廃止したページ・旧カテゴリ URL からテーマページへの恒久転送 (301) 表。
 *
 * 記録の正本は台帳 `site.theme-redirects` (data/site/url-history/theme-redirects.json)。ここは読み込み口。
 * 転送先テーマの実在は `src/config/__tests__/legacy-theme-redirects.test.ts` が ALL_THEMES / AREA_THEME_SLUGS と照合する。
 * middleware はこの表を上から順に照合し、最初に一致した行の転送先へクエリを保ったまま 301 を返す。
 */

import { hrefFor } from '@stats47/data-configs/content/href';

import data from '../../../../data/site/url-history/theme-redirects.json';

export interface LegacyThemePathRedirect {
  /** 旧 URL の pathname */
  readonly pattern: RegExp;
  /** 転送先テーマの slug。空文字はテーマ一覧 `/themes` */
  readonly themeSlug: string;
  /** 廃止の経緯 */
  readonly note: string;
}

/** 照合順に並べる (具体 path を先、ハブのフォールバックを最後) */
export const LEGACY_THEME_PATH_REDIRECTS: readonly LegacyThemePathRedirect[] = data.pathRedirects.map(
  (row) => ({
    pattern: new RegExp(row.pattern),
    themeSlug: row.themeSlug ?? '',
    note: `${row.since} 廃止。${row.reason}`,
  }),
);

/** 一致した旧 URL の転送先 pathname (クエリは呼び元が付ける)。一致しなければ undefined */
export function resolveLegacyThemePathRedirect(pathname: string): string | undefined {
  const row = LEGACY_THEME_PATH_REDIRECTS.find(({ pattern }) => pattern.test(pathname));
  if (!row) return undefined;
  return row.themeSlug ? hrefFor('theme', { themeSlug: row.themeSlug }) : '/themes';
}

/**
 * `/areas/{prefCode}/{categoryKey}` (旧カテゴリ別ページ) → `/areas/{prefCode}/{themeSlug}` の対応。
 * 空文字は対応テーマなし → `/areas/{prefCode}` (エリアプロフィール) へ転送する。
 * 除外する行の理由 (tourism・administrativefinancial) は台帳の Schema に書いてある。middleware.test.ts が表の全行の着地を固定する。
 */
export const AREA_CATEGORY_TO_THEME: Readonly<Record<string, string>> = Object.fromEntries(
  data.areaCategoryRedirects.map((row) => [row.categoryKey, row.themeSlug ?? '']),
);
