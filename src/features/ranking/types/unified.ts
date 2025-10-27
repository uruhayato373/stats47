/**
 * 統一ランキングデータ型定義
 * アダプターレイヤーで使用される共通データ型
 */

/**
 * 地域タイプ
 */
export type AreaType = "national" | "prefecture" | "city";

/**
 * 対象地域レベル
 */
export type TargetAreaLevel = "prefecture" | "city" | "both";

/**
 * ランキングメタデータ
 */
export interface RankingMetadata {
  rankingKey: string;
  dataSourceId: string;
  dataSourceName: string;
  label: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  conversionFactor: number;
  decimalPlaces: number;
  visualization: VisualizationConfig;
  statistics?: RankingStatistics;
  lastUpdated: string;
  updateFrequency?: string;
  targetAreaLevel: TargetAreaLevel;
  hierarchy?: {
    supportsPrefecture: boolean;
    supportsCity boolean;
    supportsComparison: boolean;
  };
}

/**
 * 可視化設定
 */
export interface VisualizationConfig {
  mapColorScheme: string;
  mapDivergingMidpoint: "zero" | "mean" | "median" | number;
  rankingDirection: "asc" | "desc";
  chartType?: "bar" | "line" | "scatter" | "heatmap";
  colorPalette?: string[];
}

/**
 * ランキングデータポイント
 */
export interface RankingDataPoint {
  areaCode: string;
  areaName: string;
  areaType: AreaType;
  parentAreaCode?: string;
  parentAreaName?: string;
  value: number;
  rawValue?: number;
  displayValue?: string;
  rank: number;
  rankInParent?: number;
  percentile?: number;
  timeCode: string;
  timeName: string;
  dataQuality?: DataPointQuality;
}

/**
 * データポイント品質
 */
export interface DataPointQuality {
  reliability: "high" | "medium" | "low";
  isEstimated: boolean;
  isInterpolated: boolean;
  notes?: string;
}

/**
 * ランキング統計情報
 */
export interface RankingStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  q1?: number;
  q3?: number;
  count: number;
  missingCount: number;
}

/**
 * 時系列情報
 */
export interface TimeSeriesInfo {
  availableYears: string[];
  currentYear: string;
  minYear: string;
  maxYear: string;
  updateFrequency?: string;
}

/**
 * データ品質
 */
export interface DataQuality {
  completeness: number; // 0.0-1.0
  reliability: "high" | "medium" | "low";
  missingAreas: string[];
  estimatedAreas: string[];
  lastValidated: string;
  notes?: string;
}

/**
 * 統一ランキングデータ
 */
export interface UnifiedRankingData {
  metadata: RankingMetadata;
  values: RankingDataPoint[];
  timeSeries?: TimeSeriesInfo;
  quality: DataQuality;
}

/**
 * R2ストレージ用のランキングデータ
 */
export interface R2RankingData {
  metadata: {
    rankingKey: string;
    timeCode: string;
    timeName: string;
    unit: string;
    targetAreaLevel: TargetAreaLevel;
    lastUpdated: string;
  };
  values: RankingDataPoint[];
  statistics: RankingStatistics;
}

/**
 * ランキング項目設定
 */
export interface RankingItemConfig {
  rankingKey: string;
  label: string;
  name: string;
  description?: string;
  unit: string;
  dataSourceId: string;
  targetAreaLevel: TargetAreaLevel;
  mapColorScheme: string;
  mapDivergingMidpoint: "zero" | "mean" | "median" | number;
  rankingDirection: "asc" | "desc";
  conversionFactor: number;
  decimalPlaces: number;
  isActive: boolean;
}
