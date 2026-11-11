import data from '../../../../data/themes/japan/catalogs.json';
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
