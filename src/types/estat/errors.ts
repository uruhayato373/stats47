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
    this.name = 'APIResponseError';
  }
}

/**
 * 設定エラー
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public configKey?: string
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * 検証エラー
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}