/**
 * @stats47/types エントリーポイント
 *
 * アプリケーション間で共有される型定義を提供します。
 */

export type { AreaType } from './area';
export type { StatsSchema } from './stats-schema';
export { type YearFormat, formatYearName } from './year-format';

// コロプレス配色の語彙 SSOT (data-configs / visualization / svg-builder が共有)
export {
  type CanonicalColorScheme,
  type ShortColorScheme,
  type ColorSchemeEntry,
  type ColorSchemeType,
  COLOR_SCHEME_CATALOG,
  DEFAULT_SEQUENTIAL_SCHEME,
  DEFAULT_DIVERGING_SCHEME,
  findColorScheme,
  normalizeColorScheme,
  toShortColorScheme,
  isKnownColorScheme,
  colorSchemeTypeOf,
  d3KeyOfColorScheme,
  assertKnownColorScheme,
} from './color-scheme';

export type {
  TopoJSONGeometry,
  TopoJSONGeometryCollection,
  TopoJSONTopology,
} from './topojson';

export type { AdminPageInfo } from './admin';

export * from './article';
export {
  IMAGE_GENERATION_MANIFEST_KIND,
  IMAGE_GENERATION_MANIFEST_SCHEMA_VERSION,
  IMAGE_GENERATION_PUBLISH_PLAN_KIND,
  IMAGE_GENERATION_PUBLISH_PLAN_SCHEMA_VERSION,
  type ImageGenerationAsset,
  type ImageGenerationManifest,
  type ImageGenerationPublishPlan,
  type ImageGenerationPublishPlanItem,
} from './image-generation-manifest';

// ============================================================================
// e-Stat 関連の共通型
// ============================================================================

/** e-Stat API の時間コード（例: "2024100000"） */
export type EstatTimeCode = string;

/** 年度コード（4桁、例: "2024"） */
export type YearCode = string;

/** 年度名（例: "2024年"、"2024年度"） */
export type YearName = string;

// ランキング表示用の共有型
export type {
  RankingDisplayEntry,
  RankingDisplayMeta,
  RankingDisplayInput,
} from './ranking-display';

// Result型
export { type Result, ok, err, isOk, isErr, unwrap } from './result';

// ブログチャートデータ
export type {
  BlogChartDataFile,
  BlogChartDataSource,
  BlogChartMeta,
} from './blog-chart-data';

// IndicatorSet（KPI・チャート定義の一元管理）
export type {
  IndicatorSet,
  IndicatorEntry,
  IndicatorSetCategory,
  IndicatorSetUsage,
  ChartDefinition,
  DualLineChartDef,
  MixedChartDef,
  DonutChartDef,
  ChartSeriesDef,
} from './indicator-set';

export {
  // レジストリ
  ALL_INDICATOR_SETS,
  THEME_INDICATOR_SETS,
  COMPARE_INDICATOR_SETS,
  // ルックアップ
  findIndicatorSet,
  getIndicatorSet,
  getRankingKeys,
  getPrimaryRankingKey,
  // 個別セット
  POPULATION_DYNAMICS_SET,
  AGING_SOCIETY_SET,
  LIVING_HOUSING_SET,
  LOCAL_ECONOMY_SET,
  LABOR_WAGES_SET,
  MANUFACTURING_SET,
  HEALTHCARE_SET,
  SAFETY_SET,
  EDUCATION_CULTURE_SET,
  TOURISM_SET,
  CONSUMER_PRICES_SET,
  FOREIGN_RESIDENTS_SET,
  OCCUPATION_SALARY_SET,
  COMPARE_FISCAL_SET,
  COMPARE_SALARY_SET,
  COMPARE_SPENDING_SET,
  COMPARE_GOVERNOR_SET,
  COMPARE_DEBT_SET,
  COMPARE_PRIVATE_WAGE_SET,
  REAL_INCOME_SET,
  LABOR_MOBILITY_SET,
  LOCAL_FINANCE_SET,
  FISHERY_MARINE_SET,
  PORTS_SET,
  RAILWAY_SET,
  ROADS_SET,
  CLIMATE_SET,
} from './indicator-sets/registry';
