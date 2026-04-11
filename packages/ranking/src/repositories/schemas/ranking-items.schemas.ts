/**
 * Ranking DB Schemas - Zodスキーマ定義
 *
 * ランキング関連のデータベース型（RankingItemDB）
 * のZodスキーマを定義し、型安全なパース関数を提供します。
 *
 * このモジュールは、データベースから取得した生データを型安全に検証・変換するために使用されます。
 * category-repository.tsと同様のパターンで実装されています。
 */

import { logger } from "@stats47/logger/server";
import type { AreaType } from "@stats47/types";
import { z } from "zod";
import type { RankingItem, SourceConfig } from "../../types";

// 文字列としての "null" を null に変換するプレプロセス関数
const normalizeNull = (val: unknown) => (val === "null" ? null : val);

// JSON文字列をオブジェクトに変換するプレプロセス関数
const parseJsonColumn = <T>(schema: z.ZodType<T>) =>
  z.preprocess((val) => {
    if (val === null || val === undefined) return undefined;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch (e) {
        return undefined;
      }
    }
    return val;
  }, schema.optional().nullable()).transform(v => v ?? undefined);

// 設定オブジェクトのスキーマ定義
const ValueDisplayConfigSchema = z.object({
  conversionFactor: z.number().nullable().optional().transform(v => v ?? undefined),
  decimalPlaces: z.number().nullable().optional().transform(v => v ?? undefined),
  displayUnit: z.string().nullable().optional().transform(v => v ?? undefined),
});

const VisualizationConfigSchema = z.object({
  colorScheme: z.string().nullable().optional().transform(v => v ?? undefined),
  colorSchemeType: z.enum(["sequential", "diverging", "categorical"]).nullable().optional().transform(v => v ?? undefined),
  minValueType: z.enum(["zero", "data-min"]).nullable().optional().transform(v => v ?? undefined),
  divergingMidpoint: z.enum(["zero", "mean", "median", "custom"]).or(z.number()).nullable().optional().transform(v => v ?? undefined),
  divergingMidpointValue: z.number().nullable().optional().transform(v => v ?? undefined),
  isSymmetrized: z.boolean().nullable().optional().transform(v => v ?? undefined),
  isReversed: z.boolean().nullable().optional().transform(v => v ?? undefined),
});

const NormalizationOptionSchema = z.object({
  type: z.enum(["per_population", "per_area"]),
  label: z.string(),
  unit: z.string(),
  scaleFactor: z.number().optional(),
  decimalPlaces: z.number().optional(),
  denominatorKey: z.string().optional(),
});

const CalculationConfigSchema = z.object({
  isCalculated: z.boolean().nullable().optional().transform(v => v ?? undefined),
  type: z.enum(["ratio", "per_capita", "subtraction", "custom"]).nullable().optional().transform(v => (v === "custom" || v === null) ? undefined : v),
  numeratorKey: z.string().nullable().optional().transform(v => v ?? undefined),
  denominatorKey: z.string().nullable().optional().transform(v => v ?? undefined),
  formula: z.string().nullable().optional().transform(v => v ?? undefined),
  normalizationOptions: z.array(NormalizationOptionSchema).nullable().optional().transform(v => v ?? undefined),
});

const SourceConfigSchema = z.object({
  collection: z.object({
    name: z.string(),
    url: z.string().optional(),
  }).optional(),
  survey: z.object({
    name: z.string(),
    url: z.string().optional(),
  }).optional(),
  statsDataId: z.string().optional(),
  itemCode: z.string().optional(),
  cdCat01: z.string().optional(),
  cdCat02: z.string().optional(),
  cdCat03: z.string().optional(),
  cdTab: z.string().optional(),
}).passthrough();

/**
 * RankingItemDBのZodスキーマ
 */
export const RankingItemDBSchema = z.object({
  ranking_key: z.string(),
  area_type: z.string(),
  ranking_name: z.string(),
  title: z.string(),
  subtitle: z.preprocess(normalizeNull, z.string().nullable()),
  demographic_attr: z.preprocess(normalizeNull, z.string().nullable()),
  normalization_basis: z.preprocess(normalizeNull, z.string().nullable()),
  unit: z.string(),
  category_key: z.string().nullable().optional().transform(v => v ?? undefined),
  group_key: z.string().nullable().optional().transform(v => v ?? undefined),
  additional_categories: parseJsonColumn(z.array(z.string())),

  annotation: z.preprocess(normalizeNull, z.string().nullable()).optional(),
  description: z.preprocess(normalizeNull, z.string().nullable()),
  latest_year: parseJsonColumn(z.union([
    z.object({ yearCode: z.string(), yearName: z.string() }),
    z.string().transform((v) => ({ yearCode: v, yearName: v })),
  ])),
  available_years: parseJsonColumn(z.array(z.union([
    z.object({ yearCode: z.string(), yearName: z.string() }),
    z.string().transform((v) => ({ yearCode: v, yearName: v })),
  ]))),
  
  is_active: z.union([z.boolean(), z.number()]).transform((val) => typeof val === "number" ? val === 1 : val),
  is_featured: z.union([z.boolean(), z.number()]).transform((val) => typeof val === "number" ? val === 1 : val).optional().default(false),
  featured_order: z.preprocess((v) => {
    if (v === null) return 0;
    if (typeof v === 'string') {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    }
    return v;
  }, z.number().optional().default(0)),

  survey_id: z.string().nullable().optional().transform(v => v ?? undefined),
  data_source_id: z.string().default('estat'),
  source_config: parseJsonColumn(SourceConfigSchema).transform(v => v as SourceConfig | undefined),
  value_display_config: parseJsonColumn(ValueDisplayConfigSchema),
  visualization_config: parseJsonColumn(VisualizationConfigSchema),
  calculation_config: parseJsonColumn(CalculationConfigSchema),
  is_calculated: z.union([z.boolean(), z.number()]).nullable().optional().transform((val) => {
    if (val === null || val === undefined) return undefined;
    return typeof val === "number" ? val === 1 : val;
  }),
  calculation_type: z.enum(["ratio", "per_capita", "subtraction", "custom"]).nullable().optional().transform(v => (v === "custom" || v === null) ? undefined : v),
  numerator_ranking_key: z.string().nullable().optional().transform(v => v ?? undefined),
  denominator_ranking_key: z.string().nullable().optional().transform(v => v ?? undefined),
  calculation_formula: z.string().nullable().optional().transform(v => v ?? undefined),

  seo_title: z.string().nullable().optional().transform(v => v ?? undefined),
  seo_description: z.string().nullable().optional().transform(v => v ?? undefined),

  created_at: z.string(),
  updated_at: z.string(),
}).transform((data): RankingItem => {
  const areaType = (data.area_type as AreaType) || "prefecture";

  // デフォルト値の設定
  const valueDisplay: RankingItem["valueDisplay"] = {
    conversionFactor: 1,
    decimalPlaces: 0,
    ...data.value_display_config,
  };

  const visualization: RankingItem["visualization"] = {
    colorScheme: "interpolateBlues",
    colorSchemeType: "sequential",
    minValueType: "zero",
    ...data.visualization_config,
  } as RankingItem["visualization"];

  // calculation_config JSON から計算設定を取得
  const calculation: RankingItem["calculation"] = {
    isCalculated: data.calculation_config?.isCalculated ?? false,
    type: data.calculation_config?.type,
    numeratorKey: data.calculation_config?.numeratorKey,
    denominatorKey: data.calculation_config?.denominatorKey,
    formula: data.calculation_config?.formula,
    normalizationOptions: data.calculation_config?.normalizationOptions,
  };

  const sourceConfig: RankingItem["sourceConfig"] = data.source_config;

  // available_years と latest_year のパース結果を型安全にキャスト
  let availableYears: { yearCode: string; yearName: string }[] | undefined = undefined;
  if (Array.isArray(data.available_years)) {
    availableYears = data.available_years;
  }
  
  let latestYear: { yearCode: string; yearName: string } | undefined = undefined;
  if(data.latest_year && typeof data.latest_year === 'object'){
      latestYear = data.latest_year;
  }

  return {
    rankingKey: data.ranking_key,
    areaType,
    rankingName: data.ranking_name,
    title: data.title,
    subtitle: data.subtitle ?? undefined,
    demographicAttr: data.demographic_attr ?? undefined,
    normalizationBasis: data.normalization_basis ?? undefined,
    unit: data.unit,
    categoryKey: data.category_key,
    additionalCategories: data.additional_categories ?? undefined,
    groupKey: data.group_key,
    annotation: data.annotation ?? undefined,
    description: data.description ?? undefined,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    latestYear,
    availableYears,
    isActive: data.is_active,
    isFeatured: data.is_featured,
    featuredOrder: data.featured_order,
    surveyId: data.survey_id,
    dataSourceId: data.data_source_id,
    sourceConfig,
    valueDisplay,
    visualization,
    calculation,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
});


export function parseRankingItemDB(data: unknown): RankingItem {
  try {
    return RankingItemDBSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error({ error: error.issues, data }, "ランキング項目データのバリデーションエラー");
      const errorMessages = error.issues.map((e) => e.message).join(", ");
      throw new Error(`ランキング項目データが不正です: ${errorMessages}`);
    }
    throw error;
  }
}

export function parseRankingItemDBArray(data: unknown): RankingItem[] {
  try {
    return z.array(RankingItemDBSchema).parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error({ error: error.issues }, "ランキング項目配列データのバリデーションエラー");
      const errorMessages = error.issues.map((e) => e.message).join(", ");
      throw new Error(`ランキング項目配列データが不正です: ${errorMessages}`);
    }
    throw error;
  }
}


