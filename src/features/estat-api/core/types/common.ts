/**
 * e-STAT API共通型定義
 *
 * 全てのe-STAT APIで共通して使用される型定義。
 * stats-data, stats-list, meta-info, datacatalog等で共有される。
 */

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

  // その他のエラー（300番台）
  UNKNOWN_ERROR = 300,
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
    this.name = "EstatAPIError";

    // detailsが存在する場合は、メッセージに追加情報を含める
    if (details && typeof details === "object") {
      if (details.ERROR_MSG) {
        this.message = `${message} (${details.ERROR_MSG})`;
      }
      if (details.URL) {
        this.message += ` [URL: ${details.URL}]`;
      }
    }
  }

  /**
   * エラーコードからエラーメッセージを生成
   */
  static fromErrorCode(code: EstatErrorCode, details?: any): EstatAPIError {
    const messages: Record<EstatErrorCode, string> = {
      [EstatErrorCode.OK]: "正常に終了しました。",
      [EstatErrorCode.OK_WITH_WARNING]:
        "正常に終了しましたが、一部にエラーがあります。",
      [EstatErrorCode.NO_DATA]: "データが存在しません。",
      [EstatErrorCode.INVALID_APP_ID]:
        "アプリケーションIDが指定されていません。",
      [EstatErrorCode.INVALID_LANG]: "パラメータ lang が不正です。",
      [EstatErrorCode.INVALID_SEARCH_KIND]:
        "パラメータ searchKind が不正です。",
      [EstatErrorCode.INVALID_SURVEY_YEARS]:
        "パラメータ surveyYears が不正です。",
      [EstatErrorCode.INVALID_OPEN_YEARS]: "パラメータ openYears が不正です。",
      [EstatErrorCode.INVALID_STATS_FIELD]:
        "パラメータ statsField が不正です。",
      [EstatErrorCode.INVALID_STATS_CODE]: "パラメータ statsCode が不正です。",
      [EstatErrorCode.INVALID_SEARCH_WORD]:
        "パラメータ searchWord が不正です。",
      [EstatErrorCode.INVALID_DATA_FORMAT]:
        "パラメータ dataFormat が不正です。",
      [EstatErrorCode.INVALID_STATS_DATA_ID]:
        "パラメータ statsDataId が不正です。",
      [EstatErrorCode.INVALID_NARROWING_COND]: "絞り込み条件が不正です。",
      [EstatErrorCode.INVALID_LEVEL_OR_CODE]:
        "階層レベル、コードの指定が不正です。",
      [EstatErrorCode.INVALID_COMBINATION]:
        "統計データの取得条件の組み合わせが不正です。",
      [EstatErrorCode.INVALID_START_POSITION]:
        "パラメータ startPosition が不正です。",
      [EstatErrorCode.INVALID_LIMIT]: "パラメータ limit が不正です。",
      [EstatErrorCode.INVALID_META_GET_FLG]:
        "パラメータ metaGetFlg が不正です。",
      [EstatErrorCode.INVALID_CNT_GET_FLG]: "パラメータ cntGetFlg が不正です。",
      [EstatErrorCode.INVALID_EXPLANATION_GET_FLG]:
        "パラメータ explanationGetFlg が不正です。",
      [EstatErrorCode.INVALID_ANNOTATION_GET_FLG]:
        "パラメータ annotationGetFlg が不正です。",
      [EstatErrorCode.INVALID_REPLACE_SP_CHARS]:
        "パラメータ replaceSpChars が不正です。",
      [EstatErrorCode.INVALID_SECTION_HEADER_FLG]:
        "パラメータ sectionHeaderFlg が不正です。",
      [EstatErrorCode.INVALID_CALLBACK]: "パラメータ callback が不正です。",
      [EstatErrorCode.INVALID_UPDATED_DATE]:
        "パラメータ updatedDate が不正です。",
      [EstatErrorCode.SYSTEM_ERROR]: "システムエラーが発生しました。",
      [EstatErrorCode.UNKNOWN_ERROR]: "不明なエラーが発生しました。",
    };

    return new EstatAPIError(
      messages[code] || "Unknown error",
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
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = "TransformError";
  }
}

/**
 * APIレスポンスエラー
 */
export class APIResponseError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = "APIResponseError";
  }
}

/**
 * 設定エラー
 */
export class ConfigurationError extends Error {
  constructor(message: string, public configKey?: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * 検証エラー
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * e-STAT API処理結果情報
 *
 * API呼び出しの成功/失敗状態とエラーメッセージを含む。
 * 全てのe-STAT APIレスポンスに共通する基本情報。
 *
 * @example
 * ```typescript
 * if (result.STATUS === 0) {
 *   console.log("API呼び出し成功:", result.ERROR_MSG);
 * } else {
 *   console.error("API呼び出し失敗:", result.ERROR_MSG);
 * }
 * ```
 */
export interface EstatResult {
  STATUS: number; // 0: 正常終了, 100以上: エラー
  ERROR_MSG: string; // エラーメッセージ（正常時は "正常に終了しました。"）
  DATE: string; // 処理日時 (YYYY-MM-DDTHH:MM:SS.sss+09:00)
}

/**
 * e-STAT APIテキストノード型
 *
 * e-STAT APIの多くのフィールドで使用される標準的なテキスト構造。
 * テキスト内容とオプションの番号属性を含む。
 *
 * @example
 * ```typescript
 * const textNode: EstatTextNode = {
 *   $: "総務省",
 *   "@no": "001"
 * };
 * console.log(textNode.$); // "総務省"
 * ```
 */
export interface EstatTextNode {
  $: string;
  "@no"?: string; // 番号属性（GOV_ORG等で使用）
}

/**
 * e-STAT API統計表情報（生データ）
 *
 * 統計表の基本情報、メタデータ、分類情報を含む。
 * stats-dataとmeta-infoで共有される。
 *
 * @example
 * ```typescript
 * const tableInfo: EstatTableInfo = statisticalData.TABLE_INF;
 * console.log(`統計表名: ${tableInfo.STAT_NAME.$}`);
 * console.log(`作成機関: ${tableInfo.GOV_ORG.$}`);
 * console.log(`調査年月: ${tableInfo.SURVEY_DATE}`);
 * ```
 */
export interface EstatTableInfo {
  "@id"?: string; // 統計表ID
  TITLE: EstatTextNode; // 統計表題名
  STAT_NAME: EstatTextNode; // 政府統計名
  GOV_ORG: EstatTextNode; // 作成機関名
  STATISTICS_NAME: string; // 提供統計名及び提供分類名
  TITLE_SPEC?: {
    // 表題仕様
    TABLE_CATEGORY?: string; // 表分類
    TABLE_NAME: string; // 表題
    TABLE_EXPLANATION?: string; // 表の説明
  };
  CYCLE: string; // 提供周期
  SURVEY_DATE: string; // 調査年月
  OPEN_DATE: string; // 公開日
  SMALL_AREA: "0" | "1" | "2"; // 小地域属性（0:該当なし、1:町丁・字等、2:市区町村）
  COLLECT_AREA: string; // 集計地域区分
  MAIN_CATEGORY: EstatTextNode; // 分野（大分類）
  SUB_CATEGORY: EstatTextNode; // 分野（小分類）
  OVERALL_TOTAL_NUMBER: number; // 総件数
  UPDATED_DATE: string; // 更新日
  TOTAL_NUMBER?: string; // 総データ件数
  FROM_NUMBER?: string; // データ開始位置
  TO_NUMBER?: string; // データ終了位置
  STATISTICS_NAME_SPEC: {
    TABULATION_CATEGORY: string; // 集計区分
    TABULATION_SUB_CATEGORY1?: string; // 集計区分1
    TABULATION_SUB_CATEGORY2?: string; // 集計区分2
    TABULATION_SUB_CATEGORY3?: string; // 集計区分3
    TABULATION_SUB_CATEGORY4?: string; // 集計区分4
    TABULATION_SUB_CATEGORY5?: string; // 集計区分5
  };
}

/**
 * e-STAT API分類情報
 *
 * 統計データの次元（地域、時間、カテゴリ等）の定義情報。
 * 各次元の項目コード、名称、階層構造を含む。
 *
 * @example
 * ```typescript
 * const classInfo: EstatClassInfo = statisticalData.CLASS_INF;
 * const areaClass = classInfo.CLASS_OBJ.find(obj => obj["@id"] === "area");
 * ```
 */
export interface EstatClassInfo {
  CLASS_OBJ: EstatClassObject[];
}

/**
 * e-STAT API分類オブジェクト（メタ情報）
 *
 * 特定の次元（表章項目、分類、地域、時間等）の定義。
 * 各次元のID、名称、説明、必須性、位置情報を含む。
 *
 * @example
 * ```typescript
 * const classObj: EstatClassObject = {
 *   "@id": "area",
 *   "@name": "地域",
 *   "@description": "都道府県・市区町村",
 *   CLASS: areaClasses,
 *   META_INFO: { NEED: "true", POSITION: "1" }
 * };
 * ```
 */
export interface EstatClassObject {
  "@id":
    | "tab"
    | "cat01"
    | "cat02"
    | "cat03"
    | "cat04"
    | "cat05"
    | "cat06"
    | "cat07"
    | "cat08"
    | "cat09"
    | "cat10"
    | "cat11"
    | "cat12"
    | "cat13"
    | "cat14"
    | "cat15"
    | "area"
    | "time"; // 分類ID
  "@name": string; // 分類名
  "@description"?: string; // 説明
  CLASS?: EstatClass | EstatClass[]; // 分類項目（単一または配列）
  META_INFO?: {
    // メタ情報（METAGET_FLG=Y時）
    NEED: "true" | "false"; // 必須有無
    POSITION: string; // 位置
  };
}

/**
 * e-STAT API分類項目
 *
 * 各次元の具体的な項目（都道府県、年度、カテゴリ等）。
 * コード、名称、階層レベル、単位、親子関係を含む。
 *
 * @example
 * ```typescript
 * const classItem: EstatClass = {
 *   "@code": "13",
 *   "@name": "東京都",
 *   "@level": "2",
 *   "@unit": "人",
 *   "@parentCode": "1",
 *   "@explanation": "都道府県"
 * };
 * ```
 */
export interface EstatClass {
  "@code": string; // 分類コード
  "@name": string; // 分類名
  "@level"?: string; // 階層レベル
  "@unit"?: string; // 単位
  "@parentCode"?: string; // 親コード
  "@explanation"?: string; // 説明
}

/**
 * API取得オプション
 */
export interface FetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}
