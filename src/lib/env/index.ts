/**
 * 環境タイプの定義
 */
export type Environment = "mock" | "development" | "staging" | "production";

/**
 * 現在の環境を取得
 */
export function getEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENV as Environment;

  // デフォルトフォールバック
  if (!env) {
    // package.jsonのスクリプト名から環境を推測
    if (process.env.npm_lifecycle_event?.includes("mock")) {
      return "mock";
    }
    if (process.env.NODE_ENV === "production") {
      return "production";
    }
    return "development";
  }

  return env;
}

/**
 * 環境別の設定を取得
 */
export function getEnvironmentConfig() {
  const env = getEnvironment();

  return {
    environment: env,
    useMock: env === "mock",
    useLocalD1: env === "development",
    useRemoteD1: env === "staging" || env === "production",
    isProduction: env === "production",
    isStaging: env === "staging",
    isDevelopment: env === "development",
    isMock: env === "mock",
  };
}
