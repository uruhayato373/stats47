import "server-only";

import { indicators } from "@stats47/database/server";

/**
 * indicators テーブルから RankingItemDB 互換形式で取り出すための SELECT (PR-4)
 *
 * 旧 ranking_items との差分:
 * - ranking_name は seo_title に migrate 済みのため title fallback で出す
 * - data_source_id は廃止 → "estat" 固定 (旧スキーマの default を踏襲)
 * - JSON 列は _json サフィックスから 旧名にマッピング
 *
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
  latest_year: indicators.latestYear,
  available_years: indicators.availableYearsJson,
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
