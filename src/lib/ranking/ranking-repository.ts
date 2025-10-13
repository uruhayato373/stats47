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
import { RankingItem, RankingItemDB } from "@/types/models/ranking";
import { convertRankingItemFromDB } from "./ranking-converters";
import { getSubcategoryConfig } from "@/lib/choropleth/category-helpers";

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
      // categories.jsonからサブカテゴリ設定を取得
      const subcategoryConfig = getSubcategoryConfig(subcategoryId);
      if (!subcategoryConfig) {
        return null;
      }

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

      // デフォルトランキングキーを取得（is_default = 1の項目）
      const defaultItem = rows.find((row) => row.is_default === 1);
      const defaultRankingKey =
        (defaultItem?.ranking_key as string) ||
        (rows[0]?.ranking_key as string);

      // サブカテゴリ設定を構築
      const config: SubcategoryConfig = {
        id: subcategoryConfig.id,
        categoryId: subcategoryConfig.categoryId,
        name: subcategoryConfig.name,
        description: subcategoryConfig.description,
        defaultRankingKey: defaultRankingKey,
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
        subcategory: config,
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
