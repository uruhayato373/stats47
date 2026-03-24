/**
 * 環境変数の取得
 *
 * アプリケーションで使用する環境変数の取得を一元管理する。
 * 環境変数が未設定の場合は、環境に応じたデフォルト値を返す。
 *
 * @module lib/env
 */

import { logger } from "@/lib/logger";

/**
 * 環境別のデフォルトベースURL
 */
const DEFAULT_BASE_URLS = {
  production: "https://stats47.jp",
  development: "http://localhost:3000",
} as const;

/**
 * 現在の環境を判定
 *
 * @returns 現在の環境（production/development）
 */
function getCurrentEnvironment(): "production" | "development" {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development";

  if (env === "production") return "production";
  return "development";
}

/**
 * 必須の環境変数 NEXT_PUBLIC_BASE_URL を取得
 *
 * NEXT_PUBLIC_BASE_URLは、メタデータ、OGPタグ、構造化データなどで使用される。
 * この環境変数が未設定の場合は、環境に応じたデフォルト値を返す。
 *
 * @returns NEXT_PUBLIC_BASE_URLの値（未設定の場合は環境に応じたデフォルト値）
 *
 * @example
 * ```typescript
 * import { getRequiredBaseUrl } from '@/lib/env';
 *
 * const baseUrl = getRequiredBaseUrl();
 * const ogpUrl = `${baseUrl}/og-image.png`;
 * ```
 */
export function getRequiredBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const currentEnv = getCurrentEnvironment();

  if (!baseUrl) {
    const fallbackUrl = DEFAULT_BASE_URLS[currentEnv];
    
    logger.warn(
      {
        env: "NEXT_PUBLIC_BASE_URL",
        currentEnvironment: currentEnv,
        fallbackUrl,
      },
      `環境変数NEXT_PUBLIC_BASE_URLが設定されていません。デフォルト値（${fallbackUrl}）を使用します。`
    );
    
    return fallbackUrl;
  }

  return baseUrl;
}
