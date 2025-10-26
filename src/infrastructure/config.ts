/**
 * 環境変数の一元管理と型安全なアクセスを提供する設定ファイル
 */

/**
 * 環境タイプの定義
 */
export type Environment = "development" | "staging" | "production";

/**
 * 環境設定の型定義
 */
export interface EnvironmentConfig {
  environment: Environment;
  isMock: boolean;
}

export const config = {
  env: process.env.NODE_ENV || "development",
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === "true",

  estat: {
    baseUrl:
      process.env.ESTAT_API_BASE_URL || "https://api.e-stat.go.jp/rest/3.0/app",
    apiKey: process.env.ESTAT_API_KEY,
  },

  cloudflare: {
    d1: process.env.CLOUDFLARE_D1_DATABASE_ID,
    r2: process.env.CLOUDFLARE_R2_BUCKET,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
  },

  mock: {
    dataPath: process.env.MOCK_DATA_PATH || "data/mock",
  },
} as const;

export type Config = typeof config;

/**
 * 現在の環境を取得
 */
export function detectEnvironment(): Environment {
  return (process.env.NODE_ENV as Environment) || "development";
}

/**
 * モックデータを使用するかどうか
 */
export function isMockDataEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === "true";
}

/**
 * 環境別の設定を構築
 */
export function buildEnvironmentConfig(): EnvironmentConfig {
  return {
    environment: detectEnvironment(),
    isMock: isMockDataEnabled(),
  };
}

/**
 * 環境判定ヘルパー関数
 */
export const isDevelopment = () => config.env === "development";
export const isMock = () => config.env === "mock";
export const isStaging = () => config.env === "staging";
export const isProduction = () => config.env === "production";

/**
 * 環境に応じたログレベル
 */
export const getLogLevel = () => {
  if (isProduction()) return "error";
  if (isStaging()) return "warn";
  return "debug";
};

/**
 * 環境に応じたAPI設定
 */
export const getApiConfig = () => {
  if (config.env === "mock") {
    return {
      baseUrl: config.mock.dataPath,
      timeout: 0,
    };
  }

  return {
    baseUrl: config.estat.baseUrl,
    timeout: 30000,
  };
};
