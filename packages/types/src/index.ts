/**
 * @stats47/types エントリーポイント
 *
 * アプリケーション間で共有される型定義を提供します。
 */

export type { AreaType } from "./area";
export type { StatsSchema } from "./stats-schema";


export type {
    TopoJSONGeometry, TopoJSONGeometryCollection, TopoJSONTopology
} from "./topojson";

export type { AdminPageInfo } from "./admin";

export * from "./article";

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
} from "./ranking-display";

// Result型
export { type Result, ok, err, isOk, isErr, unwrap } from "./result";

// ブログチャートデータ
export type {
  BlogChartDataFile,
  BlogChartDataSource,
  BlogChartMeta,
} from "./blog-chart-data";

// IndicatorSet（KPI・チャート定義の一元管理）
export type {
  IndicatorSet,
  IndicatorEntry,
  IndicatorPanelTab,
  IndicatorSetCategory,
  IndicatorSetUsage,
  ChartDefinition,
  DualLineChartDef,
  MixedChartDef,
  DonutChartDef,
  ChartSeriesDef,
} from "./indicator-set";

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
} from "./indicator-sets/registry";
