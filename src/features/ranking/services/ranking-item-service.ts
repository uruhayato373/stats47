/**
 * Rankingドメイン - ランキング項目サービス
 * ランキング項目のデータ取得とビジネスロジックを担当
 */

import { getActiveRankingItems } from "@data/mock/ranking/ranking-items";

import type { RankingItem } from "../types";

/**
 * ランキング項目サービスクラス
 */
export class RankingItemService {
  /**
   * 有効なランキング項目を取得
   * @returns ランキング項目の配列
   */
  static async getActiveItems(): Promise<RankingItem[]> {
    try {
      return getActiveRankingItems();
    } catch (error) {
      console.error("Failed to fetch ranking items:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "ランキング項目の取得に失敗しました"
      );
    }
  }

  /**
   * カテゴリとサブカテゴリでフィルタリング
   * @param category カテゴリID
   * @param subcategory サブカテゴリID
   * @returns フィルタリングされたランキング項目の配列
   */
  static async getItemsByCategory(
    category: string,
    subcategory: string
  ): Promise<RankingItem[]> {
    const items = await this.getActiveItems();
    // 将来的にフィルタリングロジックを追加
    return items;
  }
}
