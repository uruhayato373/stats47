/**
 * 環境タイプの定義
 */
export type Environment = "development" | "staging" | "production";

/**
 * 現在の環境を取得
 */
export function getEnvironment(): Environment {
  return (process.env.NODE_ENV as Environment) || "development";
}

/**
 * モックデータを使用するかどうか
 */
export function useMockData(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === "true";
}

/**
 * 環境別の設定を取得
 */
export function getEnvironmentConfig() {
  const env = getEnvironment();
  const isMock = useMockData();

  return {
    environment: env,
    isMock,
    isProduction: env === "production",
    isDevelopment: env === "development",
    isStaging: env === "staging",
  };
}
