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
