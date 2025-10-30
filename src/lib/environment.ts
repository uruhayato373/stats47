/**
 * 環境変数の一元管理と型安全なアクセスを提供する設定ファイル
 *
 * このファイルは以下の責務を持ちます:
 * - 環境変数の読み込みとデフォルト値の設定
 * - 環境タイプの判定（development/staging/production）
 * - モックデータモードの制御
 * - 環境別の設定値の提供
 */

// 型定義のインポートとエクスポート
import type {
  Config,
  Environment,
  EnvironmentConfig,
} from "@/types/environment";

export type { Config, Environment, EnvironmentConfig };

/**
 * アプリケーションの設定オブジェクト
 */
export const config = {
  env: process.env.NODE_ENV || "development",
  mock: {
    dataPath: process.env.MOCK_DATA_PATH || "data/mock", // テストやStorybook用
  },
} as const;

/**
 * 現在の実行環境を解決
 */
function resolveEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development";
  if (env === "production" || env === "staging" || env === "development") {
    return env;
  }
  return "development";
}

/**
 * 環境設定オブジェクトを構築
 */
export function buildEnvironmentConfig(): EnvironmentConfig {
  return {
    environment: resolveEnvironment(),
  };
}
