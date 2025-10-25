import estatMetainfo from "@data/mock/database/estat_metainfo.json";
import rankingItems from "@data/mock/database/ranking_items.json";
import rankingValues from "@data/mock/database/ranking_values.json";
import users from "@data/mock/database/users.json";

/**
 * モックデータプロバイダー
 * JSONファイルからデータを取得
 */
export class MockDataProvider {
  /**
   * estat_metainfo_unique ビューからデータを取得（モック版）
   */
  async fetchEstatMetainfoUnique(options?: {
    limit?: number;
    orderBy?: string;
  }): Promise<any[]> {
    const { limit = 50 } = options || {};

    // JSONファイルの構造: [{ results: [...] }]
    const data = estatMetainfo[0]?.results || [];

    // limit適用
    return data.slice(0, limit);
  }

  /**
   * ranking_itemsテーブルからデータを取得（モック版）
   */
  async fetchRankingItems(options?: { limit?: number }): Promise<any[]> {
    const { limit = 10 } = options || {};
    const data = rankingItems[0]?.results || [];
    return data.slice(0, limit);
  }

  /**
   * ranking_valuesテーブルからデータを取得（モック版）
   */
  async fetchRankingValues(options?: {
    limit?: number;
    rankingKey?: string;
  }): Promise<any[]> {
    const { limit = 50, rankingKey } = options || {};
    let data = rankingValues[0]?.results || [];

    // フィルタリング
    if (rankingKey) {
      data = data.filter((item: any) => item.ranking_key === rankingKey);
    }

    return data.slice(0, limit);
  }
}

// D1互換のインターフェースを実装したMockDataProvider
export const mockDataProvider = {
  // D1互換のprepareメソッド
  prepare: (sql: string) => ({
    bind: (...params: unknown[]) => ({
      first: async () => {
        // SQLを解析してモックデータを返す
        if (sql.includes("SELECT * FROM users WHERE email = ?")) {
          const email = params[0] as string;
          const userData = users[0]?.results || [];
          return userData.find((u: any) => u.email === email) || null;
        }
        return null;
      },
      all: async () => {
        // 必要に応じて実装
        return { success: true, results: [], meta: { duration: 1 } };
      },
      run: async () => {
        // UPDATE文などはモックでは何もしない
        return { success: true, meta: { duration: 1 } };
      },
    }),
    first: async () => {
      // パラメータなしのクエリ
      return null;
    },
    all: async () => {
      return { success: true, results: [], meta: { duration: 1 } };
    },
    run: async () => {
      return { success: true, meta: { duration: 1 } };
    },
  }),
  
  // 既存のメソッド
  fetchEstatMetainfoUnique: async (options?: {
    limit?: number;
    orderBy?: string;
  }): Promise<any[]> => {
    const { limit = 50 } = options || {};
    const data = estatMetainfo[0]?.results || [];
    return data.slice(0, limit);
  },
  
  fetchRankingItems: async (options?: { limit?: number }): Promise<any[]> => {
    const { limit = 10 } = options || {};
    const data = rankingItems[0]?.results || [];
    return data.slice(0, limit);
  },
  
  fetchRankingValues: async (options?: {
    limit?: number;
    rankingKey?: string;
  }): Promise<any[]> => {
    const { limit = 50, rankingKey } = options || {};
    let data = rankingValues[0]?.results || [];

    if (rankingKey) {
      data = data.filter((item: any) => item.ranking_key === rankingKey);
    }

    return data.slice(0, limit);
  },
};
