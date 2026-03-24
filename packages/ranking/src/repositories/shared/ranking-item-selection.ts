import "server-only";

import { rankingItems } from "@stats47/database/server";

export const rankingItemSelection = {
  ranking_key: rankingItems.rankingKey,
  area_type: rankingItems.areaType,
  ranking_name: rankingItems.rankingName,
  title: rankingItems.title,
  subtitle: rankingItems.subtitle,
  demographic_attr: rankingItems.demographicAttr,
  normalization_basis: rankingItems.normalizationBasis,
  unit: rankingItems.unit,
  category_key: rankingItems.categoryKey,
  group_key: rankingItems.groupKey,
  additional_categories: rankingItems.additionalCategories,
  description: rankingItems.description,
  latest_year: rankingItems.latestYear,
  available_years: rankingItems.availableYears,
  is_active: rankingItems.isActive,
  is_featured: rankingItems.isFeatured,
  featured_order: rankingItems.featuredOrder,
  survey_id: rankingItems.surveyId,
  data_source_id: rankingItems.dataSourceId,
  source_config: rankingItems.sourceConfig,
  value_display_config: rankingItems.valueDisplayConfig,
  visualization_config: rankingItems.visualizationConfig,
  calculation_config: rankingItems.calculationConfig,
  created_at: rankingItems.createdAt,
  updated_at: rankingItems.updatedAt,
};
