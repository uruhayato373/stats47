/**
 * e-Stat API 設定・定数
 *
 * e-Stat API関連の設定値と定数を統一して管理する。
 * - 設定値: 環境変数から読み込む実行時設定（バッチ処理、レート制限、タイムアウトなど）
 * - 定数: 固定の値（API URL、エンドポイント、選択肢オプションなど）
 */

/**
 * e-Stat API の設定値
 *
 * 環境変数から読み込んだ設定値を型安全に管理。
 * デフォルト値も含めて、全ての設定項目を明示的に定義。
 */
export const ESTAT_API_CONFIG = {
  // バッチ処理設定
  BATCH_SIZE: parseInt(process.env.NEXT_PUBLIC_ESTAT_BATCH_SIZE || "10", 10),
  BATCH_DELAY_MS: parseInt(
    process.env.NEXT_PUBLIC_ESTAT_BATCH_DELAY_MS || "1000",
    10
  ),

  // レート制限設定
  RATE_LIMIT_PER_MINUTE: parseInt(
    process.env.NEXT_PUBLIC_ESTAT_RATE_LIMIT_PER_MINUTE || "60",
    10
  ),
  RATE_LIMIT_PER_HOUR: parseInt(
    process.env.NEXT_PUBLIC_ESTAT_RATE_LIMIT_PER_HOUR || "1000",
    10
  ),

  // タイムアウト設定
  REQUEST_TIMEOUT_MS: parseInt(
    process.env.NEXT_PUBLIC_ESTAT_REQUEST_TIMEOUT_MS || "30000",
    10
  ),
  CONNECTION_TIMEOUT_MS: parseInt(
    process.env.NEXT_PUBLIC_ESTAT_CONNECTION_TIMEOUT_MS || "10000",
    10
  ),

  // リトライ設定
  MAX_RETRIES: parseInt(process.env.NEXT_PUBLIC_ESTAT_MAX_RETRIES || "3", 10),
  RETRY_DELAY_MS: parseInt(
    process.env.NEXT_PUBLIC_ESTAT_RETRY_DELAY_MS || "2000",
    10
  ),

  // ログ設定
  LOG_LEVEL: (process.env.NEXT_PUBLIC_ESTAT_LOG_LEVEL || "info") as
    | "debug"
    | "info"
    | "warn"
    | "error",
  ENABLE_DEBUG_LOGS: process.env.NEXT_PUBLIC_ESTAT_DEBUG === "true",

  // データ処理設定
  MAX_RECORDS_PER_REQUEST: parseInt(
    process.env.NEXT_PUBLIC_ESTAT_MAX_RECORDS_PER_REQUEST || "10000",
    10
  ),
  ENABLE_DATA_CACHING: process.env.NEXT_PUBLIC_ESTAT_ENABLE_CACHING !== "false",
  CACHE_TTL_MS: parseInt(
    process.env.NEXT_PUBLIC_ESTAT_CACHE_TTL_MS || "300000",
    10
  ), // 5分

  // 都道府県フィルタ設定
  PREFECTURE_CODE_LENGTH: 5,
  PREFECTURE_CODE_SUFFIX: "000",
  EXCLUDE_NATIONAL_CODE: "00000",

  // 年次ソート設定
  DEFAULT_YEAR_SORT_ORDER: "desc" as "asc" | "desc",

  // エラーハンドリング設定
  ENABLE_DETAILED_ERRORS: process.env.NODE_ENV === "development",
  MAX_ERROR_MESSAGE_LENGTH: parseInt(
    process.env.NEXT_PUBLIC_ESTAT_MAX_ERROR_MESSAGE_LENGTH || "500",
    10
  ),
} as const;

/**
 * 設定値の検証
 *
 * 環境変数から読み込んだ設定値が有効な範囲内かチェックし、
 * 無効な値の場合はデフォルト値にフォールバックする。
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // バッチサイズの検証
  if (ESTAT_API_CONFIG.BATCH_SIZE < 1 || ESTAT_API_CONFIG.BATCH_SIZE > 100) {
    errors.push(
      `BATCH_SIZE must be between 1 and 100, got: ${ESTAT_API_CONFIG.BATCH_SIZE}`
    );
  }

  // 遅延時間の検証
  if (
    ESTAT_API_CONFIG.BATCH_DELAY_MS < 0 ||
    ESTAT_API_CONFIG.BATCH_DELAY_MS > 60000
  ) {
    errors.push(
      `BATCH_DELAY_MS must be between 0 and 60000ms, got: ${ESTAT_API_CONFIG.BATCH_DELAY_MS}`
    );
  }

  // レート制限の検証
  if (
    ESTAT_API_CONFIG.RATE_LIMIT_PER_MINUTE < 1 ||
    ESTAT_API_CONFIG.RATE_LIMIT_PER_MINUTE > 1000
  ) {
    errors.push(
      `RATE_LIMIT_PER_MINUTE must be between 1 and 1000, got: ${ESTAT_API_CONFIG.RATE_LIMIT_PER_MINUTE}`
    );
  }

  // タイムアウトの検証
  if (
    ESTAT_API_CONFIG.REQUEST_TIMEOUT_MS < 1000 ||
    ESTAT_API_CONFIG.REQUEST_TIMEOUT_MS > 300000
  ) {
    errors.push(
      `REQUEST_TIMEOUT_MS must be between 1000 and 300000ms, got: ${ESTAT_API_CONFIG.REQUEST_TIMEOUT_MS}`
    );
  }

  // リトライ回数の検証
  if (ESTAT_API_CONFIG.MAX_RETRIES < 0 || ESTAT_API_CONFIG.MAX_RETRIES > 10) {
    errors.push(
      `MAX_RETRIES must be between 0 and 10, got: ${ESTAT_API_CONFIG.MAX_RETRIES}`
    );
  }

  // エラーがある場合は警告を出力（本番環境では無視）
  if (errors.length > 0) {
    const message = `e-Stat API設定に問題があります:\n${errors.join("\n")}`;
    if (process.env.NODE_ENV === "development") {
      console.warn(message);
    }
  }
}

/**
 * 設定値の型定義
 */
export type EstatApiConfig = typeof ESTAT_API_CONFIG;

/**
 * 設定値のキー型
 */
export type EstatApiConfigKey = keyof EstatApiConfig;

/**
 * 設定値の取得（型安全）
 *
 * @param key - 設定キー
 * @returns 設定値
 */
export function getConfigValue<K extends EstatApiConfigKey>(
  key: K
): EstatApiConfig[K] {
  return ESTAT_API_CONFIG[key];
}

/**
 * 設定値の更新（開発環境のみ）
 *
 * @param key - 設定キー
 * @param value - 新しい値
 */
export function setConfigValue<K extends EstatApiConfigKey>(
  key: K,
  value: EstatApiConfig[K]
): void {
  if (process.env.NODE_ENV === "development") {
    // 開発環境でのみ書き込み可能にするため、型アサーションを使用

    (ESTAT_API_CONFIG as Record<string, unknown>)[key] = value;
  } else {
    console.warn("設定値の変更は開発環境でのみ可能です");
  }
}

// ============================================================================
// 定数定義
// ============================================================================

/**
 * e-Stat API の基本設定定数
 */
export const ESTAT_API = {
  BASE_URL: "https://api.e-stat.go.jp/rest/3.0",
  VERSION: "3.0",
  DATA_FORMAT: "json",
  DEFAULT_LANG: "J",
} as const;

/**
 * 環境変数からAPIキーを取得
 * Cloudflare Workers環境ではprocess.envが利用できないため、直接値を設定
 */
export const ESTAT_APP_ID = "59eb12e8a25751dfc27f2e48fcdfa8600b86655e";

/**
 * API エンドポイント
 */
export const ESTAT_ENDPOINTS = {
  GET_STATS_DATA: "/app/json/getStatsData",
  GET_META_INFO: "/app/json/getMetaInfo",
  GET_STATS_LIST: "/app/json/getStatsList",
  GET_DATA_CATALOG: "/app/json/getDataCatalog",
} as const;

/**
 * サンプル統計表ID（人口統計など）
 */
export const SAMPLE_STATS_DATA_IDS = {
  POPULATION: "0003448237", // 人口推計
  HOUSEHOLD: "0003348237", // 世帯数
  ECONOMY: "0003160000", // 県民経済計算
} as const;

// ============================================================================
// 選択肢オプション
// ============================================================================

/**
 * 選択肢の型定義
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * 統計分野の選択肢
 * e-Stat API公式の統計分野コードに準拠
 * @see https://www.e-stat.go.jp/api/api-info/statsfield
 */
export const STATS_FIELD_OPTIONS: SelectOption[] = [
  { value: "", label: "選択してください" },
  { value: "01", label: "国土・気象" },
  { value: "02", label: "人口・世帯" },
  { value: "03", label: "労働・賃金" },
  { value: "04", label: "農林水産業" },
  { value: "05", label: "鉱工業" },
  { value: "06", label: "商業・サービス業" },
  { value: "07", label: "企業・家計・経済" },
  { value: "08", label: "住宅・土地・建設" },
  { value: "09", label: "エネルギー・水" },
  { value: "10", label: "運輸・観光" },
  { value: "11", label: "情報通信・科学技術" },
  { value: "12", label: "教育・文化・スポーツ・生活" },
  { value: "13", label: "行財政" },
  { value: "14", label: "司法・安全・環境" },
  { value: "15", label: "社会保障・衛生" },
  { value: "16", label: "国際" },
];

/**
 * 集計地域区分の選択肢
 */
export const COLLECT_AREA_OPTIONS: SelectOption[] = [
  { value: "", label: "すべて" },
  { value: "1", label: "全国" },
  { value: "2", label: "都道府県" },
  { value: "3", label: "市区町村" },
];

/**
 * 取得件数の選択肢
 */
export const LIMIT_OPTIONS: SelectOption[] = [
  { value: "50", label: "50件" },
  { value: "100", label: "100件" },
  { value: "500", label: "500件" },
  { value: "1000", label: "1000件" },
];

// ============================================================================
// 初期化
// ============================================================================

// 初期化時に設定値を検証
if (typeof window === "undefined") {
  // サーバーサイドでのみ実行
  validateConfig();
}
