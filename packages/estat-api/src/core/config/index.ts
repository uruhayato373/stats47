/**
 * e-Stat API 設定・定数
 */
export const ESTAT_API_CONFIG = {
  // レート制限設定
  RATE_LIMIT_PER_MINUTE: typeof process !== "undefined" ? parseInt(process.env.NEXT_PUBLIC_ESTAT_RATE_LIMIT_PER_MINUTE || "60", 10) : 60,

  // タイムアウト設定
  REQUEST_TIMEOUT_MS: typeof process !== "undefined" ? parseInt(process.env.NEXT_PUBLIC_ESTAT_REQUEST_TIMEOUT_MS || "60000", 10) : 60000,

  // リトライ設定
  MAX_RETRIES: typeof process !== "undefined" ? parseInt(process.env.NEXT_PUBLIC_ESTAT_MAX_RETRIES || "3", 10) : 3,
  RETRY_DELAY_MS: typeof process !== "undefined" ? parseInt(process.env.NEXT_PUBLIC_ESTAT_RETRY_DELAY_MS || "2000", 10) : 2000,
} as const;

export const ESTAT_API = {
  BASE_URL: "https://api.e-stat.go.jp/rest/3.0",
  DATA_FORMAT: "json",
  DEFAULT_LANG: "J",
} as const;

export const ESTAT_APP_ID = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_ESTAT_APP_ID || "") : "";

export const ESTAT_ENDPOINTS = {
  GET_STATS_DATA: "/app/json/getStatsData",
  GET_META_INFO: "/app/json/getMetaInfo",
  GET_STATS_LIST: "/app/json/getStatsList",
} as const;

