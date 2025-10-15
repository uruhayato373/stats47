import rankingItems from "@/data/mock/database/ranking_items.json";
import rankingValues from "@/data/mock/database/ranking_values.json";
import estatMetainfo from "@/data/mock/database/estat_metainfo.json";

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

export const mockDataProvider = new MockDataProvider();
