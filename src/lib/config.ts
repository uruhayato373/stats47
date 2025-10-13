/**
 * 環境変数管理ヘルパー
 * 本番環境での設定ミスを防止し、開発効率を維持する
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * ベースURLを取得する
 * 本番環境では環境変数必須、開発環境ではデフォルト値を提供
 */
export function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  // 本番環境では環境変数必須
  if (process.env.NODE_ENV === "production" && !baseUrl) {
    throw new ConfigError(
      "NEXT_PUBLIC_BASE_URL environment variable is required in production."
    );
  }

  // 開発環境で未設定の場合は警告
  if (!baseUrl) {
    console.warn(
      "⚠️  NEXT_PUBLIC_BASE_URL is not set. Using default: http://localhost:3000"
    );
    return "http://localhost:3000";
  }

  // URL形式の検証
  try {
    new URL(baseUrl);
  } catch {
    throw new ConfigError(
      `NEXT_PUBLIC_BASE_URL is not a valid URL: ${baseUrl}`
    );
  }

  return baseUrl;
}

/**
 * 設定を検証する
 * 本番環境ではエラーを投げ、開発環境では警告のみ
 */
export function validateConfig(): void {
  try {
    getBaseUrl();
    console.log("✅ Configuration validated successfully");
  } catch (error) {
    console.error("❌ Configuration validation failed:", error);
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}
