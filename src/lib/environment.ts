/**
 * 環境変数の一元管理と型安全なアクセスを提供
 *
 * 環境変数の読み込み、環境タイプの判定、モックデータモードの制御を行う。
 * アプリケーション全体で使用する環境設定の一元管理を提供する。
 *
 * @module lib/environment
 */

import type { Environment } from "@/types/environment";

/**
 * アプリケーションの設定オブジェクト
 *
 * 環境変数から読み込んだ設定値を保持する。
 * `as const` により、値が不変であることを保証する。
 *
 * @example
 * ```typescript
 * console.log(config.env); // "development" | "production" | ...
 * console.log(config.mock.dataPath); // "data/mock" | ...
 * ```
 */
export const config = {
  env: process.env.NODE_ENV || "development",
  mock: {
    dataPath: process.env.MOCK_DATA_PATH || "data/mock",
  },
} as const;

/**
 * 現在の実行環境を解決
 *
 * 環境変数から実行環境を判定し、型安全な `Environment` 型を返す。
 * 優先順位: `NEXT_PUBLIC_ENV` > `NODE_ENV` > デフォルト（"development"）
 *
 * @returns 現在の実行環境（development/staging/production）
 *
 * @example
 * ```typescript
 * const env = resolveEnvironment();
 * if (env === "production") {
 *   // 本番環境の処理
 * }
 * ```
 */
function resolveEnvironment(): Environment {
  const env =
    process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development";
  if (env === "production" || env === "staging" || env === "development") {
    return env;
  }
  return "development";
}

/**
 * 環境設定オブジェクトを構築
 *
 * 現在の実行環境を含む設定オブジェクトを作成する。
 * 環境に応じた処理の分岐などで使用する。
 *
 * @returns 環境設定オブジェクト（`environment` プロパティを含む）
 *
 * @example
 * ```typescript
 * const config = buildEnvironmentConfig();
 * console.log(config.environment); // "development" | "staging" | "production"
 * ```
 */
export function buildEnvironmentConfig(): { environment: Environment } {
  return {
    environment: resolveEnvironment(),
  };
}
