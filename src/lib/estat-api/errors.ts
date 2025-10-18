/**
 * e-Stat API エラークラス
 *
 * e-Stat API関連のエラーを統一して管理するためのカスタムエラークラス群。
 * エラーの種類、原因、コンテキストを明確にし、デバッグとエラーハンドリングを改善する。
 */

/**
 * e-Stat API の基底エラークラス
 *
 * 全てのe-Stat API関連エラーの基底クラス。
 * エラーコード、元のエラー、追加のコンテキスト情報を含む。
 */
export class EstatApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "EstatApiError";
  }
}

/**
 * メタ情報取得エラー
 *
 * getMetaInfo APIの実行時に発生するエラー。
 * 統計表ID、APIレスポンス、ネットワークエラーなどを含む。
 */
export class EstatMetaInfoFetchError extends EstatApiError {
  constructor(
    message: string,
    public statsDataId: string,
    originalError?: unknown
  ) {
    super(message, "META_INFO_FETCH_ERROR", originalError);
    this.name = "EstatMetaInfoFetchError";
  }
}

/**
 * 統計データ取得エラー
 *
 * getStatsData APIの実行時に発生するエラー。
 * 統計表ID、パラメータ、APIレスポンスなどを含む。
 */
export class EstatStatsDataFetchError extends EstatApiError {
  constructor(
    message: string,
    public statsDataId: string,
    public parameters?: Record<string, unknown>,
    originalError?: unknown
  ) {
    super(message, "STATS_DATA_FETCH_ERROR", originalError);
    this.name = "EstatStatsDataFetchError";
  }
}

/**
 * ID検証エラー
 *
 * 統計表IDやその他のIDの形式が不正な場合に発生するエラー。
 * 無効なID、形式エラー、範囲外の値などを含む。
 */
export class EstatIdValidationError extends EstatApiError {
  constructor(
    message: string,
    public invalidId: string,
    public validationRule?: string
  ) {
    super(message, "ID_VALIDATION_ERROR");
    this.name = "EstatIdValidationError";
  }
}

/**
 * データ変換エラー
 *
 * APIレスポンスの変換処理中に発生するエラー。
 * 予期しないデータ形式、必須フィールドの欠落、型の不一致などを含む。
 */
export class EstatDataTransformError extends EstatApiError {
  constructor(
    message: string,
    public transformStep?: string,
    public dataContext?: Record<string, unknown>,
    originalError?: unknown
  ) {
    super(message, "DATA_TRANSFORM_ERROR", originalError);
    this.name = "EstatDataTransformError";
  }
}

/**
 * バッチ処理エラー
 *
 * 複数の統計表を一括処理する際に発生するエラー。
 * 処理の進捗、失敗したID、レート制限などを含む。
 */
export class EstatBatchProcessError extends EstatApiError {
  constructor(
    message: string,
    public processedCount: number,
    public totalCount: number,
    public failedIds: string[],
    originalError?: unknown
  ) {
    super(message, "BATCH_PROCESS_ERROR", originalError);
    this.name = "EstatBatchProcessError";
  }
}

/**
 * APIレート制限エラー
 *
 * e-Stat APIのレート制限に引っかかった場合に発生するエラー。
 * 制限の種類、復旧予定時間、推奨される待機時間などを含む。
 */
export class EstatRateLimitError extends EstatApiError {
  constructor(
    message: string,
    public limitType: "per_minute" | "per_hour" | "per_day",
    public retryAfter?: number,
    originalError?: unknown
  ) {
    super(message, "RATE_LIMIT_ERROR", originalError);
    this.name = "EstatRateLimitError";
  }
}

/**
 * 設定エラー
 *
 * API設定やアプリケーション設定に問題がある場合に発生するエラー。
 * 設定ファイル、環境変数、デフォルト値などを含む。
 */
export class EstatConfigError extends EstatApiError {
  constructor(
    message: string,
    public configKey?: string,
    public expectedType?: string,
    public actualValue?: unknown
  ) {
    super(message, "CONFIG_ERROR");
    this.name = "EstatConfigError";
  }
}
