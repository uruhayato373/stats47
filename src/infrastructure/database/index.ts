import { buildEnvironmentConfig } from "@/lib/environment";

import { createLocalD1Database } from "./local";
import { mockDataProvider } from "./mock";
import { createRemoteD1Database } from "./remote";

/**
 * 環境に応じて適切なデータプロバイダーを取得
 *
 * - Development: ローカルD1を使用（Mock環境でもDBはローカルD1）
 * - Production: リモートD1を使用
 * - Mock環境ではe-Stat APIのみをモック、DBはローカルD1を使用
 */
export const getDataProvider = async () => {
  const config = buildEnvironmentConfig();

  // 開発環境では常にローカルD1を使用
  // (Mock環境でもDBはローカルD1、e-Stat APIのみモック)
  if (config.environment === "development") {
    return await createLocalD1Database();
  }

  // 本番環境ではリモートD1
  if (config.environment === "production") {
    return await createRemoteD1Database();
  }

  // デフォルトはローカルD1
  return await createLocalD1Database();
};

// 後方互換性のため個別エクスポートも提供
export { createLocalD1Database, createRemoteD1Database, mockDataProvider };

// ストレージサブドメイン
export * from "./storage";
