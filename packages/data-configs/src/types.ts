/**
 * MetricConfig 型定義 — page ごとの統計データ要件の真実源 (SSOT)
 *
 * 配置: packages/data-configs/src/metrics/<metric-key>.ts
 * registry: packages/data-configs/src/registry.ts (codegen)
 * D1 metrics テーブル: 上記から build-time export される cache (編集禁止)
 */

export type EntityKind = "prefecture" | "city" | "port" | "migration-flow";

export const ENTITY_KINDS = [
  "prefecture",
  "city",
  "port",
  "migration-flow",
] as const;

/** データの取得元 */
export type SourceConfig =
  | EstatSource
  | KakeiChousaSource
  | MlitSource
  | ExternalSource
  | CalculatedSource;

export interface EstatSource {
  kind: "estat";
  /** e-Stat statsDataId (10桁) */
  statsDataId: string;
  /** 大分類カテゴリ (例 "#C04505") */
  cdCat01?: string;
  /** サブカテゴリ */
  cdCat02?: string;
  /** 表示用 source 名 (UI ラベル) */
  displayName?: string;
  /** 出典 URL (UI リンク) */
  url?: string;
}

export interface KakeiChousaSource {
  kind: "kakei-chousa";
  /** 家計調査の cat01 等のフィルタ (実データは入れ子の {name,url} も含む) */
  filter?: Record<string, unknown>;
  displayName?: string;
  url?: string;
}

export interface MlitSource {
  kind: "mlit";
  /** 国交省 resource ID */
  resourceId: string;
  displayName?: string;
  url?: string;
}

export interface ExternalSource {
  kind: "external";
  /** 一般化された外部 source (custom fetcher 必要) */
  fetcherKey: string;
  config: Record<string, unknown>;
  displayName?: string;
  url?: string;
}

export interface CalculatedSource {
  kind: "calculated";
  /** 計算式 (numerator / denominator 等の組合せ) */
  formula: CalculationFormula;
}

export type CalculationFormula =
  | { op: "divide"; numerator: string; denominator: string }
  | { op: "multiply"; left: string; right: string }
  | { op: "per_population"; numerator: string };

/** 取得対象年 */
export type YearSpec =
  | "all"
  | { from: number; to: number }
  | { years: number[] };

/** 可視化 */
export interface VisualizationConfig {
  /** D3 color interpolator name */
  colorScheme?: string;
  colorSchemeType?: "sequential" | "diverging";
  minValueType?: "zero" | "data-min";
  /** 動画演出用プリセット */
  preset?: string;
  /** diverging のときの中央値定義 ("zero" | "median" | "custom" 等) */
  divergingMidpoint?: string;
  /** divergingMidpoint = "custom" のときの値 */
  divergingMidpointValue?: number;
  /** カラースケール反転 */
  isReversed?: boolean;
  /** diverging で対称化 */
  isSymmetrized?: boolean;
}

/** 表示 */
export interface DisplayConfig {
  conversionFactor?: number;
  decimalPlaces?: number;
  displayUnit?: string;
  /** legacy: display にも normalizationOptions が入っている metric あり */
  normalizationOptions?: NormalizationOption[];
  /** legacy: railway-passengers 等で display 内に isCalculated が入っているケース */
  isCalculated?: boolean;
}

/** 計算オプション (per_population, per_area などの派生 metric 生成定義) */
export interface NormalizationOption {
  type: "per_population" | "per_area" | "per_household";
  label: string;
  unit: string;
  scaleFactor: number;
  decimalPlaces: number;
}

export interface CalculationOptions {
  isCalculated: boolean;
  isPairRelationship?: boolean;
  normalizationOptions?: NormalizationOption[];
  /** legacy: 計算式 (旧フォーマット) */
  formula?: string;
  description?: string;
  /** legacy: 分子/分母 (複数 naming convention あり) */
  type?: string;
  calculationType?: string;
  numerator?: string;
  denominator?: string;
  numeratorKey?: string;
  denominatorKey?: string;
  numeratorRankingKey?: string;
  denominatorRankingKey?: string;
}

/** Metric 1 つ分の全データ要件 */
export interface MetricConfig {
  /** kebab-case の一意キー。ファイル名と一致 */
  key: string;
  /** 日本語タイトル */
  title: string;
  subtitle?: string;
  description?: string;
  /** 単位 (例: "人", "万円") */
  unit: string;
  /** カテゴリキー (population, commercial, etc.) */
  category: string;
  /** 観測値の取得元 */
  source: SourceConfig;
  /** 保持するエンティティ種別 (どの stats_* に相当するか) */
  entities: EntityKind[];
  /** 取得年範囲 */
  years: YearSpec;
  yearFormat?: "fiscal" | "calendar" | "plain";
  visualization?: VisualizationConfig;
  display?: DisplayConfig;
  calculation?: CalculationOptions;
  /** sub-property tags (旧 additional_categories) */
  additionalCategories?: string[];
  /** group_key — テーマダッシュボードでの集約用 */
  groupKey?: string;
  /** SEO */
  seoTitle?: string;
  seoDescription?: string;
  /** 表示用 ON/OFF */
  isActive?: boolean;
  isFeatured?: boolean;
  featuredOrder?: number;
}

/** registry へ登録される record 型 */
export type MetricRegistry = Record<string, MetricConfig>;
