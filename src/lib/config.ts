/**
 * 環境変数の一元管理と型安全なアクセスを提供する設定ファイル
 */

export const config = {
  env: process.env.NEXT_PUBLIC_ENV || "development",

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
