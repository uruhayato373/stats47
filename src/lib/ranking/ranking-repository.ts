/**
 * ランキング関連のデータベースアクセス層
 *
 * 目的:
 * - データベースアクセスロジックをカプセル化
 * - 型安全なデータベース操作
 * - エラーハンドリングの統一
 * - テスト容易性の向上
 */

import { createLocalD1Database } from "@/lib/local-d1-client";
import { QUERIES } from "./ranking-queries";
import {
  RankingItem,
  convertRankingItemFromDB,
  RankingItemDB,
} from "@/types/models/ranking";

export interface SubcategoryConfig {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  defaultRankingKey: string;
}

export interface RankingConfigResponse {
  subcategory: SubcategoryConfig;
  rankingItems: RankingItem[];
}

export class RankingRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * サブカテゴリのランキング項目を取得
   */
  async getRankingItemsBySubcategory(
    subcategoryId: string
  ): Promise<RankingConfigResponse | null> {
    try {
      const result = await this.db
        .prepare(QUERIES.getRankingItemsBySubcategory)
        .bind(subcategoryId)
        .all();

      if (!result.success) {
        throw new Error("Database query failed");
      }

      const rows = result.results as Array<Record<string, unknown>>;

      if (rows.length === 0) {
        return null;
      }

      // サブカテゴリ設定を取得
      const subcategoryConfig: SubcategoryConfig = {
        id: rows[0].subcategory_id as string,
        categoryId: rows[0].category_id as string,
        name: rows[0].subcategory_name as string,
        description: rows[0].description as string | undefined,
        defaultRankingKey: rows[0].default_ranking_key as string,
      };

      // ランキング項目を取得（ランキング項目がある行のみ）
      const rankingItems = rows
        .filter((row) => row.ranking_key)
        .map((row) => {
          const dbItem = row as RankingItemDB & { metadata_json?: string };

          // JSONメタデータをパースしてstats_data_idとcd_cat01を抽出
          if (dbItem.metadata_json) {
            try {
              const metadata = JSON.parse(dbItem.metadata_json);
              dbItem.stats_data_id = metadata.stats_data_id;
              dbItem.cd_cat01 = metadata.cd_cat01;
            } catch (error) {
              console.warn("Failed to parse metadata JSON:", error);
            }
          }

          return convertRankingItemFromDB(dbItem);
        });

      return {
        subcategory: subcategoryConfig,
        rankingItems,
      };
    } catch (error) {
      console.error("Failed to get ranking items by subcategory:", error);
      throw error;
    }
  }

  /**
   * 単一のランキング項目を取得
   */
  async getRankingItemById(id: number): Promise<RankingItem | null> {
    try {
      const result = await this.db
        .prepare(QUERIES.getRankingItemById)
        .bind(id)
        .first();

      if (!result) {
        return null;
      }

      return convertRankingItemFromDB(result as RankingItemDB);
    } catch (error) {
      console.error("Failed to get ranking item by id:", error);
      throw error;
    }
  }

  /**
   * ランキング項目を更新
   */
  async updateRankingItem(
    id: number,
    updates: {
      label?: string;
      mapColorScheme?: string;
      mapDivergingMidpoint?: string;
      rankingDirection?: "asc" | "desc";
      conversionFactor?: number;
      decimalPlaces?: number;
    }
  ): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(QUERIES.updateRankingItem)
        .bind(
          updates.label,
          updates.mapColorScheme,
          updates.mapDivergingMidpoint,
          updates.rankingDirection,
          updates.conversionFactor,
          updates.decimalPlaces,
          id
        )
        .run();

      return result.success;
    } catch (error) {
      console.error("Failed to update ranking item:", error);
      throw error;
    }
  }

  /**
   * ランキング項目を削除（論理削除）
   */
  async deleteRankingItem(id: number): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(QUERIES.deleteRankingItem)
        .bind(id)
        .run();

      return result.success;
    } catch (error) {
      console.error("Failed to delete ranking item:", error);
      throw error;
    }
  }

  /**
   * ランキング項目の表示順序を更新
   */
  async updateRankingItemOrder(
    id: number,
    displayOrder: number
  ): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(QUERIES.updateRankingItemOrder)
        .bind(displayOrder, id)
        .run();

      return result.success;
    } catch (error) {
      console.error("Failed to update ranking item order:", error);
      throw error;
    }
  }
}

/**
 * ランキングリポジトリのインスタンスを作成
 */
export async function createRankingRepository(): Promise<RankingRepository> {
  const db = await createLocalD1Database();
  return new RankingRepository(db);
}
