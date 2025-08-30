# e-STAT API 完全型定義（公式仕様準拠）

## 1. e-STAT API生レスポンス型定義

### 1.1 getStatsData API レスポンス型
```typescript
// types/estat/raw-response.ts

/**
 * e-STAT API getStatsData のレスポンス型
 * @see https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0#api_4
 */
export interface EstatStatsDataResponse {
  GET_STATS_DATA: {
    RESULT: EstatResult;
    PARAMETER: EstatStatsDataParameter;
    STATISTICAL_DATA: EstatStatisticalData;
  };
}

/**
 * 処理結果情報
 */
export interface EstatResult {
  STATUS: number;           // 0: 正常終了, 100以上: エラー
  ERROR_MSG: string;        // エラーメッセージ（正常時は "正常に終了しました。"）
  DATE: string;            // 処理日時 (YYYY-MM-DDTHH:MM:SS.sss+09:00)
}

/**
 * getStatsData リクエストパラメータ情報
 */
export interface EstatStatsDataParameter {
  LANG: 'J' | 'E';                    // 言語
  STATS_DATA_ID: string;               // 統計表ID
  DATA_FORMAT: 'X' | 'J';              // データ形式 (X: XML, J: JSON)
  START_POSITION?: number;             // データ取得開始位置
  LIMIT?: number;                      // データ取得件数
  METAGET_FLG: 'Y' | 'N';            // メタ情報取得フラグ
  CNT_GET_FLG: 'Y' | 'N';            // データ件数取得フラグ
  EXPLANATION_GET_FLG: 'Y' | 'N';    // 解説情報取得フラグ
  ANNOTATION_GET_FLG: 'Y' | 'N';     // 注釈情報取得フラグ
  REPLACE_SP_CHARS: '0' | '1' | '2'; // 特殊文字の置換
  // 以下、絞り込み条件として使用されたパラメータが含まれる
  NARROWING_COND?: {
    [key: string]: string;            // lvTab, cdTab, cdCat01等の絞り込み条件
  };
}

/**
 * 統計データ本体
 */
export interface EstatStatisticalData {
  RESULT_INF: EstatResultInfo;
  TABLE_INF: EstatTableInfo;
  CLASS_INF: EstatClassInfo;
  DATA_INF: EstatDataInfo;
  EXPLANATION?: EstatExplanation;     // 解説情報（EXPLANATION_GET_FLG=Y時）
}

/**
 * データ件数情報
 */
export interface EstatResultInfo {
  TOTAL_NUMBER: number;    // 総データ件数
  FROM_NUMBER: number;     // データ開始位置（CNT_GET_FLG=Y時）
  TO_NUMBER: number;       // データ終了位置（CNT_GET_FLG=Y時）
  NEXT_KEY?: number;       // 次のデータ開始位置（継続データがある場合）
}

/**
 * 統計表情報
 */
export interface EstatTableInfo {
  TITLE: EstatTextNode;                  // 統計表題名
  STAT_NAME: EstatTextNode;              // 政府統計名
  GOV_ORG: EstatTextNode;                // 作成機関名
  STATISTICS_NAME: string;               // 提供統計名及び提供分類名
  TITLE_SPEC?: {                         // 表題仕様
    TABLE_CATEGORY?: string;              // 表分類
    TABLE_NAME: string;                   // 表題
    TABLE_EXPLANATION?: string;           // 表の説明
  };
  CYCLE: string;                          // 提供周期
  SURVEY_DATE: string;                    // 調査年月
  OPEN_DATE: string;                      // 公開日
  SMALL_AREA: '0' | '1' | '2';          // 小地域属性（0:該当なし、1:町丁・字等、2:市区町村）
  COLLECT_AREA: string;                   // 集計地域区分
  MAIN_CATEGORY: EstatTextNode;          // 分野（大分類）
  SUB_CATEGORY: EstatTextNode;           // 分野（小分類）
  OVERALL_TOTAL_NUMBER: number;          // 総件数
  UPDATED_DATE: string;                   // 更新日
  STATISTICS_NAME_SPEC: {
    TABULATION_CATEGORY: string;          // 集計区分
    TABULATION_SUB_CATEGORY1?: string;    // 集計区分1
    TABULATION_SUB_CATEGORY2?: string;    // 集計区分2
    TABULATION_SUB_CATEGORY3?: string;    // 集計区分3
    TABULATION_SUB_CATEGORY4?: string;    // 集計区分4
    TABULATION_SUB_CATEGORY5?: string;    // 集計区分5
  };
}

/**
 * テキストノード型
 */
export interface EstatTextNode {
  $: string;
  '@no'?: string;  // 番号属性（GOV_ORG等で使用）
}

/**
 * 分類情報
 */
export interface EstatClassInfo {
  CLASS_OBJ: EstatClassObject[];
}

/**
 * 分類オブジェクト（メタ情報）
 */
export interface EstatClassObject {
  '@id': 'tab' | 'cat01' | 'cat02' | 'cat03' | 'cat04' | 'cat05' | 
         'cat06' | 'cat07' | 'cat08' | 'cat09' | 'cat10' | 
         'cat11' | 'cat12' | 'cat13' | 'cat14' | 'cat15' | 
         'area' | 'time';              // 分類ID
  '@name': string;                     // 分類名
  '@description'?: string;             // 説明
  CLASS?: EstatClass | EstatClass[];   // 分類項目（単一または配列）
  META_INFO?: {                        // メタ情報（METAGET_FLG=Y時）
    NEED: 'true' | 'false';           // 必須有無
    POSITION: string;                  // 位置
  };
}

/**
 * 分類項目
 */
export interface EstatClass {
  '@code': string;      // 項目コード
  '@name': string;      // 項目名
  '@level': string;     // 階層レベル
  '@unit'?: string;     // 単位
  '@parentCode'?: string; // 親コード（階層構造の場合）
  '@explanation'?: string; // 説明
}

/**
 * データ情報
 */
export interface EstatDataInfo {
  NOTE?: EstatNote | EstatNote[];      // 注釈（単一または配列）
  VALUE: EstatValue | EstatValue[];    // データ値（単一または配列）
}

/**
 * 注釈情報
 */
export interface EstatNote {
  '@char': string;      // 注釈記号
  '$': string;          // 注釈内容
}

/**
 * データ値
 */
export interface EstatValue {
  '@tab': string;       // 表章項目コード（必須）
  '@cat01'?: string;    // 分類01コード
  '@cat02'?: string;    // 分類02コード  
  '@cat03'?: string;    // 分類03コード
  '@cat04'?: string;    // 分類04コード
  '@cat05'?: string;    // 分類05コード
  '@cat06'?: string;    // 分類06コード
  '@cat07'?: string;    // 分類07コード
  '@cat08'?: string;    // 分類08コード
  '@cat09'?: string;    // 分類09コード
  '@cat10'?: string;    // 分類10コード
  '@cat11'?: string;    // 分類11コード
  '@cat12'?: string;    // 分類12コード
  '@cat13'?: string;    // 分類13コード
  '@cat14'?: string;    // 分類14コード
  '@cat15'?: string;    // 分類15コード
  '@area'?: string;     // 地域コード
  '@time'?: string;     // 時間軸コード
  '@unit'?: string;     // 単位
  '$': string;          // 値（数値または特殊文字）
}

/**
 * 解説情報
 */
export interface EstatExplanation {
  EXPLANATION_INF: Array<{
    '@id': string;      // 解説ID
    ITEM: string;       // 項目名
    EXPLANATION: string; // 解説内容
  }>;
}
```

### 1.2 getMetaInfo API レスポンス型
```typescript
// types/estat/meta-response.ts

/**
 * getMetaInfo APIのレスポンス型
 * メタ情報（項目名、コード等）を取得
 */
export interface EstatMetaInfoResponse {
  GET_META_INFO: {
    RESULT: EstatResult;
    PARAMETER: {
      LANG: 'J' | 'E';
      DATA_FORMAT: 'X' | 'J';
      STATS_DATA_ID: string;
    };
    METADATA_INF: {
      TABLE_INF: EstatTableInfo;
      CLASS_INF: EstatClassInfo;
    };
  };
}
```

### 1.3 getStatsList API レスポンス型
```typescript
// types/estat/list-response.ts

/**
 * getStatsList APIのレスポンス型
 * 統計表の検索
 */
export interface EstatStatsListResponse {
  GET_STATS_LIST: {
    RESULT: EstatResult;
    PARAMETER: EstatStatsListParameter;
    DATALIST_INF: {
      NUMBER: number;           // 統計表数
      RESULT_INF?: {           // LIMIT指定時
        FROM_NUMBER: number;
        TO_NUMBER: number;
      };
      LIST_INF?: {             // 統計表リスト（0件の場合は存在しない）
        TABLE_INF?: EstatTableListItem | EstatTableListItem[];
      };
    };
  };
}

/**
 * getStatsList パラメータ
 */
export interface EstatStatsListParameter {
  LANG: 'J' | 'E';
  DATA_FORMAT: 'X' | 'J';
  SEARCH_KIND: '1' | '2' | '3';    // 検索種別
  REPLACE_SP_CHARS: '0' | '1' | '2';
  // 検索条件
  SURVEY_YEARS?: string;            // 調査年月
  OPEN_YEARS?: string;              // 公開年月
  UPDATED_DATE?: string;            // 更新日付
  STATS_CODE?: string;              // 政府統計コード
  SEARCH_WORD?: string;             // キーワード
  STATS_NAME?: string;              // 政府統計名
  GOV_ORG?: string;                // 作成機関
  STATS_NAME_LIST?: string;         // 提供統計名
  TITLE?: string;                   // 統計表題
  EXPLANATION?: string;             // 統計表の説明
  FIELD?: string;                   // 分野
  LAYOUT?: string;                  // 統計大分類
  TOUKEI?: string;                 // 統計小分類
  // ページング
  START_POSITION?: number;
  LIMIT?: number;
}

/**
 * 統計表リスト項目
 */
export interface EstatTableListItem {
  '@id': string;                         // 統計表ID
  STAT_NAME: EstatTextNode;             // 政府統計名
  GOV_ORG: EstatTextNode;               // 作成機関
  STATISTICS_NAME: string;              // 提供統計名
  TITLE: EstatTextNode;                 // 統計表題
  CYCLE?: string;                       // 周期
  SURVEY_DATE?: string;                 // 調査年月
  OPEN_DATE?: string;                   // 公開日
  SMALL_AREA?: '0' | '1' | '2';        // 小地域
  OVERALL_TOTAL_NUMBER?: number;        // 総件数
  UPDATED_DATE?: string;                // 更新日
  TITLE_SPEC?: {
    TABLE_CATEGORY?: string;
    TABLE_NAME: string;
    TABLE_EXPLANATION?: string;
  };
  STATISTICS_NAME_SPEC?: {
    TABULATION_CATEGORY: string;
    TABULATION_SUB_CATEGORY1?: string;
    TABULATION_SUB_CATEGORY2?: string;
    TABULATION_SUB_CATEGORY3?: string;
    TABULATION_SUB_CATEGORY4?: string;
    TABULATION_SUB_CATEGORY5?: string;
  };
  MAIN_CATEGORY?: EstatTextNode;        // 分野（大分類）
  SUB_CATEGORY?: EstatTextNode;         // 分野（小分類）
}
```

### 1.4 getDataCatalog API レスポンス型
```typescript
// types/estat/catalog-response.ts

/**
 * getDataCatalog APIのレスポンス型
 * 統計表ファイル（Excel、CSV、PDF）の取得
 */
export interface EstatDataCatalogResponse {
  GET_DATA_CATALOG: {
    RESULT: EstatResult;
    PARAMETER: {
      LANG: 'J' | 'E';
      DATA_FORMAT: 'X' | 'J';
      STATS_DATA_ID: string;
    };
    DATA_CATALOG_LIST_INF: {
      DATA_CATALOG_INF?: EstatDataCatalogItem | EstatDataCatalogItem[];
    };
  };
}

/**
 * データカタログ項目
 */
export interface EstatDataCatalogItem {
  '@id': string;                        // ファイルID
  STAT_NAME: EstatTextNode;            // 政府統計名
  GOV_ORG: EstatTextNode;              // 作成機関
  STATISTICS_NAME: string;             // 提供統計名
  TITLE: EstatTextNode;                // ファイル名
  CYCLE?: string;                      // 周期
  SURVEY_DATE?: string;                // 調査年月
  OPEN_DATE?: string;                  // 公開日
  LANGUAGE?: string;                   // 言語
  FILE_FORMAT?: 'XLS' | 'CSV' | 'PDF'; // ファイル形式
  ESTAT_URL?: string;                  // e-StatのURL
  DESCRIPTION?: string;                // 説明
}
```

## 2. APIパラメータ型定義

```typescript
// types/estat/parameters.ts

/**
 * getStatsData APIパラメータ
 */
export interface GetStatsDataParams {
  // 必須パラメータ
  appId: string;                       // アプリケーションID
  statsDataId: string;                 // 統計表ID
  
  // 絞り込み条件（階層）
  lvTab?: string;                      // 表章項目の階層レベル
  lvCat01?: string;                    // 分類01の階層レベル
  lvCat02?: string;                    // 分類02の階層レベル
  lvCat03?: string;                    // 分類03の階層レベル
  lvCat04?: string;                    // 分類04の階層レベル
  lvCat05?: string;                    // 分類05の階層レベル
  lvCat06?: string;                    // 分類06の階層レベル
  lvCat07?: string;                    // 分類07の階層レベル
  lvCat08?: string;                    // 分類08の階層レベル
  lvCat09?: string;                    // 分類09の階層レベル
  lvCat10?: string;                    // 分類10の階層レベル
  lvCat11?: string;                    // 分類11の階層レベル
  lvCat12?: string;                    // 分類12の階層レベル
  lvCat13?: string;                    // 分類13の階層レベル
  lvCat14?: string;                    // 分類14の階層レベル
  lvCat15?: string;                    // 分類15の階層レベル
  lvArea?: string;                     // 地域の階層レベル
  lvTime?: string;                     // 時間軸の階層レベル
  
  // 絞り込み条件（コード）
  cdTab?: string;                      // 表章項目コード（カンマ区切り）
  cdCat01?: string;                    // 分類01コード（カンマ区切り）
  cdCat02?: string;                    // 分類02コード（カンマ区切り）
  cdCat03?: string;                    // 分類03コード（カンマ区切り）
  cdCat04?: string;                    // 分類04コード（カンマ区切り）
  cdCat05?: string;                    // 分類05コード（カンマ区切り）
  cdCat06?: string;                    // 分類06コード（カンマ区切り）
  cdCat07?: string;                    // 分類07コード（カンマ区切り）
  cdCat08?: string;                    // 分類08コード（カンマ区切り）
  cdCat09?: string;                    // 分類09コード（カンマ区切り）
  cdCat10?: string;                    // 分類10コード（カンマ区切り）
  cdCat11?: string;                    // 分類11コード（カンマ区切り）
  cdCat12?: string;                    // 分類12コード（カンマ区切り）
  cdCat13?: string;                    // 分類13コード（カンマ区切り）
  cdCat14?: string;                    // 分類14コード（カンマ区切り）
  cdCat15?: string;                    // 分類15コード（カンマ区切り）
  cdArea?: string;                     // 地域コード（カンマ区切り）
  cdTime?: string;                     // 時間軸コード（カンマ区切り）
  
  // 絞り込み条件（From-To）
  cdTimeFrom?: string;                 // 時間軸From
  cdTimeTo?: string;                   // 時間軸To
  
  // データ取得位置
  startPosition?: number;              // データ開始位置（デフォルト:1）
  limit?: number;                      // データ取得件数（デフォルト:100000）
  
  // 出力オプション
  lang?: 'J' | 'E';                   // 言語（デフォルト:J）
  metaGetFlg?: 'Y' | 'N';             // メタ情報取得（デフォルト:Y）
  cntGetFlg?: 'Y' | 'N';              // 件数取得（デフォルト:N）
  explanationGetFlg?: 'Y' | 'N';      // 解説情報取得（デフォルト:N）
  annotationGetFlg?: 'Y' | 'N';       // 注釈情報取得（デフォルト:N）
  replaceSpChars?: '0' | '1' | '2';   // 特殊文字置換（0:置換しない、1:NULL、2:0）
  sectionHeaderFlg?: '1' | '2';       // セクションヘッダ（1:有り、2:無し）
}
```

## 3. 整形後の型定義

### 3.1 基本的な整形後の型
```typescript
// types/estat/processed.ts

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
```

### 3.2 地図表示用の型定義
```typescript
// types/estat/map-data.ts

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
```

## 4. エラー型定義

```typescript
// types/estat/errors.ts

/**
 * e-STAT APIエラーコード
 * @see https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0#api_5_3
 */
export enum EstatErrorCode {
  // 正常系
  OK = 0,
  OK_WITH_WARNING = 1,
  NO_DATA = 2,
  
  // パラメータエラー（100番台）
  INVALID_APP_ID = 100,
  INVALID_LANG = 101,
  INVALID_SEARCH_KIND = 102,
  INVALID_SURVEY_YEARS = 103,
  INVALID_OPEN_YEARS = 104,
  INVALID_STATS_FIELD = 105,
  INVALID_STATS_CODE = 106,
  INVALID_SEARCH_WORD = 107,
  INVALID_DATA_FORMAT = 110,
  INVALID_STATS_DATA_ID = 111,
  INVALID_NARROWING_COND = 112,
  INVALID_LEVEL_OR_CODE = 113,
  INVALID_COMBINATION = 114,
  INVALID_START_POSITION = 130,
  INVALID_LIMIT = 131,
  INVALID_META_GET_FLG = 140,
  INVALID_CNT_GET_FLG = 141,
  INVALID_EXPLANATION_GET_FLG = 142,
  INVALID_ANNOTATION_GET_FLG = 143,
  INVALID_REPLACE_SP_CHARS = 144,
  INVALID_SECTION_HEADER_FLG = 150,
  INVALID_CALLBACK = 160,
  INVALID_UPDATED_DATE = 170,
  
  // システムエラー（200番台）
  SYSTEM_ERROR = 999,
}

/**
 * e-STAT APIエラー
 */
export class EstatAPIError extends Error {
  constructor(
    message: string,
    public code: EstatErrorCode,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'EstatAPIError';
  }
  
  /**
   * エラーコードからエラーメッセージを生成
   */
  static fromErrorCode(code: EstatErrorCode, details?: any): EstatAPIError {
    const messages: Record<EstatErrorCode, string> = {
      [EstatErrorCode.OK]: '正常に終了しました。',
      [EstatErrorCode.OK_WITH_WARNING]: '正常に終了しましたが、一部にエラーがあります。',
      [EstatErrorCode.NO_DATA]: 'データが存在しません。',
      [EstatErrorCode.INVALID_APP_ID]: 'アプリケーションIDが指定されていません。',
      [EstatErrorCode.INVALID_LANG]: 'パラメータ lang が不正です。',
      [EstatErrorCode.INVALID_SEARCH_KIND]: 'パラメータ searchKind が不正です。',
      [EstatErrorCode.INVALID_SURVEY_YEARS]: 'パラメータ surveyYears が不正です。',
      [EstatErrorCode.INVALID_OPEN_YEARS]: 'パラメータ openYears が不正です。',
      [EstatErrorCode.INVALID_STATS_FIELD]: 'パラメータ statsField が不正です。',
      [EstatErrorCode.INVALID_STATS_CODE]: 'パラメータ statsCode が不正です。',
      [EstatErrorCode.INVALID_SEARCH_WORD]: 'パラメータ searchWord が不正です。',
      [EstatErrorCode.INVALID_DATA_FORMAT]: 'パラメータ dataFormat が不正です。',
      [EstatErrorCode.INVALID_STATS_DATA_ID]: 'パラメータ statsDataId が不正です。',
      [EstatErrorCode.INVALID_NARROWING_COND]: '絞り込み条件が不正です。',
      [EstatErrorCode.INVALID_LEVEL_OR_CODE]: '階層レベル、コードの指定が不正です。',
      [EstatErrorCode.INVALID_COMBINATION]: '統計データの取得条件の組み合わせが不正です。',
      [EstatErrorCode.INVALID_START_POSITION]: 'パラメータ startPosition が不正です。',
      [EstatErrorCode.INVALID_LIMIT]: 'パラメータ limit が不正です。',
      [EstatErrorCode.INVALID_META_GET_FLG]: 'パラメータ metaGetFlg が不正です。',
      [EstatErrorCode.INVALID_CNT_GET_FLG]: 'パラメータ cntGetFlg が不正です。',
      [EstatErrorCode.INVALID_EXPLANATION_GET_FLG]: 'パラメータ explanationGetFlg が不正です。',
      [EstatErrorCode.INVALID_ANNOTATION_GET_FLG]: 'パラメータ annotationGetFlg が不正です。',
      [EstatErrorCode.INVALID_REPLACE_SP_CHARS]: 'パラメータ replaceSpChars が不正です。',
      [EstatErrorCode.INVALID_SECTION_HEADER_FLG]: 'パラメータ sectionHeaderFlg が不正です。',
      [EstatErrorCode.INVALID_CALLBACK]: 'パラメータ callback が不正です。',
      [EstatErrorCode.INVALID_UPDATED_DATE]: 'パラメータ updatedDate が不正です。',
      [EstatErrorCode.SYSTEM_ERROR]: 'システムエラーが発生しました。',
    };
    
    return new EstatAPIError(
      messages[code] || 'Unknown error',
      code,
      code,
      details
    );
  }
}

/**
 * データ変換エラー
 */
export class TransformError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'TransformError';
  }
}