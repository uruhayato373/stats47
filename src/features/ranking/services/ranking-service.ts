/**
 * ランキングデータ管理サービス
 *
 * ランキング関連のAPI呼び出しとデータ取得を一元管理
 */

export interface RankingConfig {
  subcategory: {
    defaultRankingKey: string;
  };
}

export class RankingService {
  /**
   * サブカテゴリのデフォルトランキングキーを取得
   * @param subcategoryId サブカテゴリID
   * @returns デフォルトランキングキー（存在しない場合はnull）
   */
  static async getDefaultRankingKey(
    subcategoryId: string
  ): Promise<string | null> {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const url = `${baseUrl}/api/ranking-items/${encodeURIComponent(
        subcategoryId
      )}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const config = (await response.json()) as RankingConfig;
        return config.subcategory.defaultRankingKey;
      }

      return null;
    } catch (error) {
      console.warn(
        `デフォルトランキングキーの取得に失敗しました (${subcategoryId}):`,
        error
      );
      return null;
    }
  }

  /**
   * ランキングアイテムの設定を取得
   * @param subcategoryId サブカテゴリID
   * @returns ランキング設定オブジェクト
   */
  static async getRankingConfig(
    subcategoryId: string
  ): Promise<RankingConfig | null> {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const url = `${baseUrl}/api/ranking-items/${encodeURIComponent(
        subcategoryId
      )}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return (await response.json()) as RankingConfig;
      }

      return null;
    } catch (error) {
      console.warn(
        `ランキング設定の取得に失敗しました (${subcategoryId}):`,
        error
      );
      return null;
    }
  }
}
