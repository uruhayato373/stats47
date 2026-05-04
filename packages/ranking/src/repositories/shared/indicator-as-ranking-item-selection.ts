import "server-only";

import { indicators } from "@stats47/database/server";

import { availableYearsSql, latestYearSql } from "./derive-years-sql";

/**
 * indicators テーブルから RankingItemDB 互換形式で取り出すための SELECT
 *
 * latest_year / available_years は cache 列ではなく observations から動的計算
 * (`derive-years-sql.ts` 参照、yearName format は "年度" 統一)。
 * data_source_id は廃止 → "estat" 固定 (旧スキーマの default を踏襲)。
 * parseRankingItemDB ではこのオブジェクトをそのまま流せる。
 */
export const indicatorAsRankingItemSelection = {
  ranking_key: indicators.key,
  area_type: indicators.areaType,
  ranking_name: indicators.title,
  title: indicators.title,
  subtitle: indicators.subtitle,
  demographic_attr: indicators.demographicAttr,
  normalization_basis: indicators.normalizationBasis,
  unit: indicators.unit,
  category_key: indicators.categoryKey,
  group_key: indicators.groupKey,
  additional_categories: indicators.additionalCategoriesJson,
  description: indicators.description,
  latest_year: latestYearSql.as("latest_year"),
  available_years: availableYearsSql.as("available_years"),
  is_active: indicators.isActive,
  is_featured: indicators.isFeatured,
  featured_order: indicators.featuredOrder,
  survey_id: indicators.surveyId,
  source_config: indicators.sourceConfigJson,
  value_display_config: indicators.valueDisplayConfigJson,
  visualization_config: indicators.visualizationConfigJson,
  calculation_config: indicators.calculationConfigJson,
  seo_title: indicators.seoTitle,
  seo_description: indicators.seoDescription,
  created_at: indicators.createdAt,
  updated_at: indicators.updatedAt,
};
