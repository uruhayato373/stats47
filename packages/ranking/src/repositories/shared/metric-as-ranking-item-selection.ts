import "server-only";

import { metrics } from "@stats47/database/server";

import { availableYearsSql, latestYearSql } from "./derive-years-sql";

/**
 * metrics テーブルから RankingItemDB 互換形式で取り出すための SELECT
 *
 * latest_year / available_years は cache 列ではなく observations から動的計算
 * (`derive-years-sql.ts` 参照、yearName format は "年度" 統一)。
 * data_source_id は廃止 → "estat" 固定 (旧スキーマの default を踏襲)。
 * parseRankingItemDB ではこのオブジェクトをそのまま流せる。
 */
export const metricAsRankingItemSelection = {
  ranking_key: metrics.key,
  ranking_name: metrics.title,
  title: metrics.title,
  subtitle: metrics.subtitle,
  demographic_attr: metrics.demographicAttr,
  normalization_basis: metrics.normalizationBasis,
  unit: metrics.unit,
  category_key: metrics.categoryKey,
  group_key: metrics.groupKey,
  additional_categories: metrics.additionalCategoriesJson,
  description: metrics.description,
  latest_year: latestYearSql.as("latest_year"),
  available_years: availableYearsSql.as("available_years"),
  is_active: metrics.isActive,
  is_featured: metrics.isFeatured,
  featured_order: metrics.featuredOrder,
  survey_id: metrics.surveyId,
  source_config: metrics.sourceConfigJson,
  value_display_config: metrics.valueDisplayConfigJson,
  visualization_config: metrics.visualizationConfigJson,
  calculation_config: metrics.calculationConfigJson,
  seo_title: metrics.seoTitle,
  seo_description: metrics.seoDescription,
  created_at: metrics.createdAt,
  updated_at: metrics.updatedAt,
};
