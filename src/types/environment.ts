/**
 * 環境変数関連の型定義
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
}

/**
 * 環境設定オブジェクトの型定義
 */
export type Config = {
  readonly env: string;
  readonly mock: {
    readonly dataPath: string;
  };
};
