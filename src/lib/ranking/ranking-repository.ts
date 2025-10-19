/**
 * ランキング関連のデータベースアクセス層
 *
 * 目的:
 * - データベースアクセスロジックをカプセル化
 * - 型安全なデータベース操作
 * - エラーハンドリングの統一
 * - テスト容易性の向上
 */

import { getDataProvider } from "@/lib/database";
import { mockDataProvider } from "@/lib/database/mock";
import { getEnvironmentConfig } from "@/lib/env";
import { QUERIES } from "./ranking-queries";
import { RankingItem, RankingItemDB } from "@/lib/ranking/types";
import { convertRankingItemFromDB } from "./ranking-converters";
import { CategoryService } from "@/lib/category";

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
   * 環境に応じた適切なリポジトリインスタンスを作成
   * ファクトリーメソッド
   */
  static async create(): Promise<RankingRepository> {
    const config = getEnvironmentConfig();

    if (config.isMock) {
      console.log(`[${config.environment}] Creating RankingRepository with mock provider`);
      return new RankingRepository(mockDataProvider as any);
    }

    console.log(`[${config.environment}] Creating RankingRepository with database provider`);
    const db = await getDataProvider();
    return new RankingRepository(db);
  }

  /**
   * ranking_itemsテーブルからデータを取得
   * database/index.ts の fetchRankingItems() を置き換え
   */
  async fetchRankingItems(options?: {
    limit?: number;
  }): Promise<any[]> {
    const config = getEnvironmentConfig();
    const { limit = 10 } = options || {};

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
      const result = await this.db
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
   * database/index.ts の fetchRankingValues() を置き換え
   */
  async fetchRankingValues(options?: {
    limit?: number;
    rankingKey?: string;
  }): Promise<any[]> {
    const config = getEnvironmentConfig();
    const { limit = 50, rankingKey } = options || {};

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

      let query = `SELECT * FROM ranking_values`;
      const params: any[] = [];

      if (rankingKey) {
        query += ` WHERE ranking_key = ?`;
        params.push(rankingKey);
      }

      query += ` LIMIT ${limit}`;

      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all();

      return result.results;
    } catch (error) {
      console.error("Failed to fetch ranking values:", error);
      return [];
    }
  }

  /**
   * サブカテゴリのランキング項目を取得
   */
  async getRankingItemsBySubcategory(
    subcategoryId: string
  ): Promise<RankingConfigResponse | null> {
    try {
      // categories.jsonからサブカテゴリ設定を取得
      const subcategory = CategoryService.getSubcategoryById(subcategoryId);
      if (!subcategory) {
        return null;
      }

      const subcategoryConfig: SubcategoryConfig = {
        id: subcategory.id,
        categoryId: subcategory.categoryId,
        name: subcategory.name,
        defaultRankingKey: subcategory.statsDataId || "",
      };

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
 * @deprecated 新しいコードでは RankingRepository.create() を使用してください
 */
export async function createRankingRepository(): Promise<RankingRepository> {
  return await RankingRepository.create();
}
