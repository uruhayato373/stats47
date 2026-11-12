import data from '../../../../data/themes/japan/catalogs.json';
import themeRedirects from '../../../../data/site/url-history/theme-redirects.json';
import { KAKEI_JAPAN_CATALOGS } from './kakei-japan-catalog';

/**
 * `/japan` の手書きのテーマ (GEO-SCOPE-SEPARATION-01)。記録の正本は台帳 `themes.japan-catalogs`
 * (data/themes/japan/catalogs.json + Schema。採用条件は Schema の description)。ここは themeSlug を
 * キーから戻し、家計調査の全国テーマ (themes.japan-kakei-catalogs) を後ろへ足して export するだけ。
 * 派生の全国値の採否は `japan-derived-metrics.ts`。
 */

export interface JapanCatalogMetric {
  metricKey: string;
  /** カードのタイル見出し (短いラベル) */
  shortLabel: string;
}

export interface JapanCatalogTheme {
  themeSlug: string;
  title: string;
  description: string;
  keywords: string[];
  metrics: JapanCatalogMetric[];
}

const RECORDED_THEMES: Record<string, JapanCatalogTheme> = Object.fromEntries(
  Object.entries(data.themes).map(([themeSlug, theme]) => [themeSlug, { themeSlug, ...theme }]),
);

export const JAPAN_CATALOGS: Record<string, JapanCatalogTheme> = {
  ...RECORDED_THEMES,
  ...KAKEI_JAPAN_CATALOGS,
};

export function getJapanCatalogTheme(themeSlug: string): JapanCatalogTheme | undefined {
  return JAPAN_CATALOGS[themeSlug];
}

export function listJapanCatalogThemes(): JapanCatalogTheme[] {
  return Object.values(JAPAN_CATALOGS);
}

/**
 * 全国のテーマ (`/themes/<テーマ>`) へ 301 した日本全体のテーマか (2026-11-12 オーナー決定で、日本全体のテーマを全国のテーマへまとめた)。
 * 記録の正本は転送表 `site.theme-redirects` (data/site/url-history/theme-redirects.json)。サイトマップ・地域の切り替え・
 * ハブの一覧・内容の台帳はこれで転送済みのページを外す (転送する一覧を別に持たない)
 */
export function isJapanThemeMovedToTheme(themeSlug: string): boolean {
  const path = `/japan/${themeSlug}`;
  // 家計の品目のテーマは別の名前のテーマ (食卓と家計の支出) の章へまとめたので、転送先の名前ではなく旧 URL が表にあるかで決める
  return themeRedirects.pathRedirects.some((row) => new RegExp(row.pattern).test(path));
}

/** 日本全体のテーマの転送先の全国のテーマの名前 (転送表の行の themeSlug)。転送していなければ undefined */
export function japanThemeDestination(themeSlug: string): string | undefined {
  const path = `/japan/${themeSlug}`;
  return themeRedirects.pathRedirects.find((row) => new RegExp(row.pattern).test(path))?.themeSlug;
}
