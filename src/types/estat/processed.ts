/**
 * 整形済み統計データ（汎用）
 */
export interface ProcessedStatsData {
  metadata: StatsMetadata;
  dimensions: StatsDimensions;
  data: StatsDataRecord[];
  statistics?: StatsStatistics;
  notes?: string[];
}

/**
 * 統計メタデータ
 */
export interface StatsMetadata {
  // 基本情報
  statsDataId: string;                 // 統計表ID
  title: string;                       // 統計表題名
  statName: string;                    // 政府統計名
  govOrg: string;                      // 作成機関名
  govOrgCode?: string;                 // 作成機関コード
  
  // 時期情報
  surveyDate?: string;                 // 調査年月
  openDate?: string;                   // 公開日
  updatedDate?: string;                // 更新日
  cycle?: string;                      // 提供周期
  
  // 分類情報
  mainCategory?: string;               // 分野（大分類）
  mainCategoryCode?: string;           // 分野コード（大分類）
  subCategory?: string;                // 分野（小分類）
  subCategoryCode?: string;            // 分野コード（小分類）
  
  // 地域情報
  collectArea?: string;                // 集計地域区分
  smallArea?: '0' | '1' | '2';        // 小地域属性
  
  // データ情報
  totalRecords: number;                // 総データ件数
  responseRecords?: number;            // 取得データ件数
  
  // 提供情報
  statisticsName?: string;             // 提供統計名
  tabulation?: {                       // 集計情報
    category: string;
    subCategory1?: string;
    subCategory2?: string;
    subCategory3?: string;
    subCategory4?: string;
    subCategory5?: string;
  };
  
  // システム情報
  lastFetched: string;                 // 取得日時
  source: 'e-stat';                    // データソース
}

/**
 * 次元情報
 */
export interface StatsDimensions {
  [dimensionId: string]: DimensionInfo;
}

/**
 * 次元詳細
 */
export interface DimensionInfo {
  id: string;                          // 次元ID (tab, cat01-15, area, time)
  name: string;                        // 次元名
  required: boolean;                   // 必須フラグ
  position?: number;                   // 表示位置
  items: DimensionItem[];              // 次元項目リスト
}

/**
 * 次元項目
 */
export interface DimensionItem {
  code: string;                        // 項目コード
  name: string;                        // 項目名
  level: string;                       // 階層レベル
  unit?: string;                       // 単位
  parentCode?: string;                 // 親コード
  explanation?: string;                // 説明
}

/**
 * データレコード
 */
export interface StatsDataRecord {
  // 値
  value: number | null;                // 数値（nullは欠損値）
  rawValue: string;                    // 元の値（特殊文字含む）
  
  // 次元情報（コードと名称）
  tab?: { code: string; name: string; };
  cat01?: { code: string; name: string; };
  cat02?: { code: string; name: string; };
  cat03?: { code: string; name: string; };
  cat04?: { code: string; name: string; };
  cat05?: { code: string; name: string; };
  cat06?: { code: string; name: string; };
  cat07?: { code: string; name: string; };
  cat08?: { code: string; name: string; };
  cat09?: { code: string; name: string; };
  cat10?: { code: string; name: string; };
  cat11?: { code: string; name: string; };
  cat12?: { code: string; name: string; };
  cat13?: { code: string; name: string; };
  cat14?: { code: string; name: string; };
  cat15?: { code: string; name: string; };
  area?: { code: string; name: string; };
  time?: { code: string; name: string; };
  
  // 追加情報
  unit?: string;                       // 単位
  annotation?: string;                 // 注釈記号
}

/**
 * 統計情報
 */
export interface StatsStatistics {
  // 基本統計量
  count: number;                       // データ件数
  validCount: number;                  // 有効データ件数
  missingCount: number;                // 欠損データ件数
  
  // 代表値
  min: number;                         // 最小値
  max: number;                         // 最大値
  sum: number;                         // 合計
  mean: number;                        // 平均
  median: number;                      // 中央値
  mode?: number;                       // 最頻値
  
  // ばらつき
  range: number;                       // 範囲
  variance: number;                    // 分散
  stdDev: number;                      // 標準偏差
  cv?: number;                        // 変動係数
  
  // 分位数
  quartiles: {
    q1: number;                        // 第1四分位数
    q2: number;                        // 第2四分位数（中央値）
    q3: number;                        // 第3四分位数
    iqr: number;                       // 四分位範囲
  };
  
  // 外れ値
  outliers?: {
    lower: number[];                   // 下側外れ値
    upper: number[];                   // 上側外れ値
  };
}