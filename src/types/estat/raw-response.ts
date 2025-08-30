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
  $: string;          // 注釈内容
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
  $: string;          // 値（数値または特殊文字）
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