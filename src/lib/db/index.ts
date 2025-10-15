import { createRemoteD1Database } from "./remote";
import { createLocalD1Database } from "./local";
import { mockDataProvider } from "./mock";
import { getEnvironmentConfig } from "@/lib/env";

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
  const config = getEnvironmentConfig();

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
export { createRemoteD1Database, createLocalD1Database, mockDataProvider };

/**
 * estat_metainfo_unique ビューからデータを取得
 * 環境に応じて自動的にデータソースを切り替え
 * @param options - クエリオプション
 * @param options.limit - 取得する最大レコード数（デフォルト: 50）
 * @param options.orderBy - ソート順（デフォルト: "updated_at DESC"）
 * @param options.useRemote - リモートD1を使用するか（デフォルト: false、非推奨）
 * @returns SavedEstatMetainfoItem[] - エラー時は空配列
 */
export async function fetchEstatMetainfoUnique(options?: {
  limit?: number;
  orderBy?: string;
  useRemote?: boolean;
}): Promise<any[]> {
  const config = getEnvironmentConfig();

  try {
    // Mock環境
    if (config.isMock) {
      console.log(
        `[${config.environment}] Fetching estat metainfo from mock data...`
      );
      return await mockDataProvider.fetchEstatMetainfoUnique(options);
    }

    // Development/Staging/Production環境
    console.log(
      `[${config.environment}] Fetching estat metainfo from database...`
    );
    const db = await getDataProvider();
    const { limit = 50, orderBy = "updated_at DESC" } = options || {};

    const result = await db
      .prepare(
        `SELECT * FROM estat_metainfo_unique ORDER BY ${orderBy} LIMIT ${limit}`
      )
      .all();

    return result.results;
  } catch (error) {
    console.error("Failed to fetch estat metainfo:", error);
    return [];
  }
}

/**
 * ranking_itemsテーブルからデータを取得
 * 環境に応じて自動的にデータソースを切り替え
 * @param options - クエリオプション
 * @param options.limit - 取得する最大レコード数（デフォルト: 10）
 * @returns RankingItem[] - エラー時は空配列
 */
export async function fetchRankingItems(options?: {
  limit?: number;
}): Promise<any[]> {
  const config = getEnvironmentConfig();

  try {
    // Mock環境
    if (config.isMock) {
      console.log(
        `[${config.environment}] Fetching ranking items from mock data...`
      );
      return await mockDataProvider.fetchRankingItems(options);
    }

    // Development/Staging/Production環境
    console.log(
      `[${config.environment}] Fetching ranking items from database...`
    );
    const db = await getDataProvider();
    const { limit = 10 } = options || {};

    const result = await db
      .prepare(`SELECT * FROM ranking_items LIMIT ${limit}`)
      .all();

    return result.results;
  } catch (error) {
    console.error("Failed to fetch ranking items:", error);
    return [];
  }
}

/**
 * ranking_valuesテーブルからデータを取得
 * 環境に応じて自動的にデータソースを切り替え
 * @param options - クエリオプション
 * @param options.limit - 取得する最大レコード数（デフォルト: 50）
 * @param options.rankingKey - 特定のランキングキーでフィルタリング
 * @returns RankingValue[] - エラー時は空配列
 */
export async function fetchRankingValues(options?: {
  limit?: number;
  rankingKey?: string;
}): Promise<any[]> {
  const config = getEnvironmentConfig();

  try {
    // Mock環境
    if (config.isMock) {
      console.log(
        `[${config.environment}] Fetching ranking values from mock data...`
      );
      return await mockDataProvider.fetchRankingValues(options);
    }

    // Development/Staging/Production環境
    console.log(
      `[${config.environment}] Fetching ranking values from database...`
    );
    const db = await getDataProvider();
    const { limit = 50, rankingKey } = options || {};

    let query = `SELECT * FROM ranking_values`;
    const params: any[] = [];

    if (rankingKey) {
      query += ` WHERE ranking_key = ?`;
      params.push(rankingKey);
    }

    query += ` LIMIT ${limit}`;

    const result = await db
      .prepare(query)
      .bind(...params)
      .all();

    return result.results;
  } catch (error) {
    console.error("Failed to fetch ranking values:", error);
    return [];
  }
}
