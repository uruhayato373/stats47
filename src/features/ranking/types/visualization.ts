/**
 * ランキング可視化オプションの統一型定義
 */
export interface RankingVisualizationOptions {
  // 地図表示オプション
  colorScheme?: string;
  divergingMidpoint?: "zero" | "mean" | "median" | number;

  // データ変換オプション
  conversionFactor?: number;
  decimalPlaces?: number;

  // ランキングオプション
  rankingDirection?: "asc" | "desc";
}

/**
 * 地図専用の可視化オプション
 */
export interface MapVisualizationOptions {
  colorScheme: string;
  divergingMidpoint: "zero" | "mean" | "median" | number;
}

/**
 * ランキングデータの状態管理用型
 */
export interface RankingDataState {
  data: any[]; // FormattedValue[] の型は後でインポート
  years: string[];
  selectedYear: string;
  loading: boolean;
  error: RankingError | null;
}

/**
 * ランキングエラー型
 */
export interface RankingError {
  message: string;
  code?: number;
  details?: {
    statsDataId?: string;
    cdCat01?: string;
    yearCode?: string;
  };
}
