import { StatsMetadata, StatsDimensions, StatsStatistics } from './processed';

/**
 * 地図表示用データ
 */
export interface MapStatsData {
  metadata: MapMetadata;
  prefectures: PrefectureData[];
  statistics: StatsStatistics;
  colorScale: ColorScaleConfig;
  rankings: RankingInfo;
  dimensions?: StatsDimensions;        // 使用された次元情報
}

/**
 * 地図用メタデータ
 */
export interface MapMetadata extends StatsMetadata {
  // マスターデータ由来の情報
  itemName?: string;                   // 項目名（CSVマスターより）
  itemCode?: string;                   // 項目コード
  originalUnit?: string;                // 元の単位
  displayUnit?: string;                 // 表示用単位
  dividingValue?: number;               // 除算値（単位変換用）
  ascending?: boolean;                  // 昇順フラグ
  
  // 絞り込み条件
  filters?: {
    tab?: string;
    cat01?: string;
    cat02?: string;
    cat03?: string;
    area?: string;
    time?: string;
    [key: string]: string | undefined;
  };
}

/**
 * 都道府県データ
 */
export interface PrefectureData {
  // 基本情報
  code: string;                        // 都道府県コード
  name: string;                        // 都道府県名
  level: string;                       // 階層レベル
  
  // 値
  value: number | null;                // 元の値
  displayValue: number | null;         // 表示用の値（単位変換済）
  formattedValue: string;              // フォーマット済み文字列
  
  // ランキング情報
  rank?: number;                       // 順位
  previousRank?: number;               // 前回順位
  rankChange?: number;                 // 順位変動
  
  // 統計情報
  deviation?: number;                  // 偏差値
  percentile?: number;                 // パーセンタイル
  zScore?: number;                     // Zスコア
  
  // 比較情報
  previousValue?: number;              // 前期値
  changeRate?: number;                 // 変化率(%)
  changeAmount?: number;               // 変化量
  
  // その他
  annotation?: string;                 // 注釈
  isOutlier?: boolean;                // 外れ値フラグ
  isEmpty?: boolean;                  // データなしフラグ
}

/**
 * カラースケール設定
 */
export interface ColorScaleConfig {
  type: 'sequential' | 'diverging' | 'categorical';
  scheme: string;                      // カラーパレット名
  domain: [number, number];            // 値の範囲
  range: string[];                     // カラーレンジ
  breaks?: number[];                   // 区切り値（階級区分用）
  method?: 'quantile' | 'equal' | 'natural' | 'manual'; // 階級区分方法
}

/**
 * ランキング情報
 */
export interface RankingInfo {
  top10: PrefectureRanking[];          // トップ10
  bottom10: PrefectureRanking[];       // ワースト10
  sortOrder: 'asc' | 'desc';           // ソート順序
  totalCount: number;                  // 有効データ数
}

/**
 * 都道府県ランキング項目
 */
export interface PrefectureRanking {
  rank: number;                        // 順位
  code: string;                        // 都道府県コード
  name: string;                        // 都道府県名
  value: number;                       // 値
  displayValue: number;                // 表示用値
  formattedValue: string;              // フォーマット済み値
  previousRank?: number;               // 前回順位
  rankChange?: number;                 // 順位変動
}

/**
 * 地図表示オプション
 */
export interface MapDisplayOptions {
  // 表示設定
  showLegend: boolean;                 // 凡例表示
  showTooltip: boolean;                // ツールチップ表示
  showRanking: boolean;                // ランキング表示
  
  // カラーリング設定
  colorScheme: string;                 // カラーパレット
  classificationMethod: 'quantile' | 'equal' | 'natural' | 'manual';
  classCount: number;                  // 階級数
  
  // インタラクション設定
  enableZoom: boolean;                 // ズーム機能
  enablePan: boolean;                  // パン機能
  enableClick: boolean;                // クリック機能
  enableHover: boolean;                // ホバー機能
  
  // データ設定
  missingDataColor: string;            // 欠損値の色
  strokeColor: string;                 // 境界線の色
  strokeWidth: number;                 // 境界線の幅
}