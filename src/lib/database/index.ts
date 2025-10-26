import { buildEnvironmentConfig } from "@/lib/env";

import { createLocalD1Database } from "./local";
import { mockDataProvider } from "./mock";
import { createRemoteD1Database } from "./remote";

/**
 * 環境に応じて適切なD1クライアントを作成
 * @param useRemote - 強制的にリモートD1を使用する場合はtrue
 * @deprecated 新しいコードでは getDataProvider() を使用してください
 */
export const createD1Database = async (useRemote = false) => {
  if (useRemote || process.env.NODE_ENV === "production") {
    return await createRemoteD1Database();
  } else {
    return await createLocalD1Database();
  }
};

/**
 * 環境に応じて適切なデータプロバイダーを取得
 */
export const getDataProvider = async () => {
  const config = buildEnvironmentConfig();

  if (config.isMock) {
    return mockDataProvider;
  }

  if (config.useLocalD1) {
    return await createLocalD1Database();
  }

  if (config.useRemoteD1) {
    return await createRemoteD1Database();
  }

  // デフォルトはローカルD1
  return await createLocalD1Database();
};

// 後方互換性のため個別エクスポートも提供
export { createLocalD1Database, createRemoteD1Database, mockDataProvider };

// ストレージサブドメイン
export * from "./storage";

// ========================================
// 以下の関数は非推奨です
// ========================================

/**
 * @deprecated EstatMetaInfoRepository.create().getMetaInfoUnique() を使用してください
 */
export async function fetchEstatMetainfoUnique(options?: {
  limit?: number;
  orderBy?: string;
}): Promise<any[]> {
  console.warn(
    "fetchEstatMetainfoUnique is deprecated. Use EstatMetaInfoRepository.create().getStatsList() instead."
  );
  const { EstatMetaInfoRepository } = await import(
    "@/lib/database/estat/repositories"
  );
  const repository = await EstatMetaInfoRepository.create();
  return await repository.getStatsList(options);
}

/**
 * @deprecated RankingRepository.create().fetchRankingItems() を使用してください
 */
export async function fetchRankingItems(options?: {
  limit?: number;
}): Promise<any[]> {
  console.warn(
    "fetchRankingItems is deprecated. Use RankingRepository.create().fetchRankingItems() instead."
  );
  const { RankingRepository } = await import(
    "@/lib/ranking/ranking-repository"
  );
  const repository = await RankingRepository.create();
  return await repository.fetchRankingItems(options);
}

/**
 * @deprecated RankingRepository.create().fetchRankingValues() を使用してください
 */
export async function fetchRankingValues(options?: {
  limit?: number;
  rankingKey?: string;
}): Promise<any[]> {
  console.warn(
    "fetchRankingValues is deprecated. Use RankingRepository.create().fetchRankingValues() instead."
  );
  const { RankingRepository } = await import(
    "@/lib/ranking/ranking-repository"
  );
  const repository = await RankingRepository.create();
  return await repository.fetchRankingValues(options);
}
