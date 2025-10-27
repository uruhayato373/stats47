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
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === "true",

  mock: {
    dataPath: process.env.MOCK_DATA_PATH || "data/mock",
  },
} as const;

/**
 * 現在の実行環境を解決
 */
function resolveEnvironment(): Environment {
  return (process.env.NODE_ENV as Environment) || "development";
}

/**
 * モックデータモードが有効かどうかを判定
 */
export function checkMockDataEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === "true";
}

/**
 * 環境設定オブジェクトを構築
 *
 * この関数は環境情報とモック設定を統合した設定オブジェクトを返します。
 */
export function buildEnvironmentConfig(): EnvironmentConfig {
  return {
    environment: resolveEnvironment(),
    isMock: checkMockDataEnabled(),
  };
}
