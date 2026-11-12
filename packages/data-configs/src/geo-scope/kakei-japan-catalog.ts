import data from '../../../../data/themes/japan/kakei-catalogs.json';
import { getMetricConfig } from '../registry';
import type { JapanCatalogTheme } from './japan-catalog';

/**
 * 公式全国行の実値・単位を検証した家計調査の年次系列。記録の正本は台帳 `themes.japan-kakei-catalogs`
 * (data/themes/japan/kakei-catalogs.json)。shortLabel は持たず、指標の題から結ぶ。
 */
export const KAKEI_JAPAN_CATALOGS: Record<string, JapanCatalogTheme> = Object.fromEntries(
  Object.entries(data.themes).map(([slug, spec]) => [slug, {
    themeSlug: slug,
    title: spec.title,
    description: spec.description,
    keywords: [...spec.keywords],
    metrics: spec.metricKeys.map(metricKey => {
      const metric = getMetricConfig(metricKey);
      if (!metric || metric.source.kind !== 'kakei-chousa') throw new Error(`家計調査の全国系列に未登録の指標: ${metricKey}`);
      return { metricKey, shortLabel: metric.title };
    }),
  }]),
);
