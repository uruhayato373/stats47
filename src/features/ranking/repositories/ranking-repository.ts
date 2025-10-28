/**
 * ランキング関連のデータベースアクセス層
 *
 * 目的:
 * - データベースアクセスロジックをカプセル化
 * - 型安全なデータベース操作
 * - エラーハンドリングの統一
 * - テスト容易性の向上
 */

import { findSubcategoryById } from "@/features/category";

import { buildEnvironmentConfig } from "@/lib/environment";

import { getDataProvider } from "@/infrastructure/database";

import { convertRankingItemFromDB } from "../converters/ranking-converters";
import { RankingItem, RankingItemDB } from "../types";

import { QUERIES } from "./ranking-queries";

import type {
  RankingGroup,
  RankingGroupDB,
  RankingGroupResponse,
} from "../types/group";

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
    const config = buildEnvironmentConfig();

    console.log(
      `[${config.environment}] Creating RankingRepository with database provider`
    );
    const db = await getDataProvider();
    return new RankingRepository(db);
  }

  /**
   * ranking_itemsテーブルからデータを取得
   * database/index.ts の fetchRankingItems() を置き換え
   */
  async fetchRankingItems(options?: { limit?: number }): Promise<any[]> {
    const config = buildEnvironmentConfig();
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
    const config = buildEnvironmentConfig();
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
      const subcategory = findSubcategoryById(subcategoryId);
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

      // ランキング項目を取得（ranking_nameをnameに変換）
      const rankingItems = rows
        .filter((row) => row.ranking_key)
        .map((row) => {
          const item = row as any;
          const dbItem: RankingItemDB = {
            id: item.id,
            ranking_key: item.ranking_key,
            label: item.label,
            name: item.ranking_name,
            description: item.description,
            unit: item.unit,
            data_source_id: item.data_source_id,
            map_color_scheme: item.map_color_scheme,
            map_diverging_midpoint: item.map_diverging_midpoint,
            ranking_direction: item.ranking_direction,
            conversion_factor: item.conversion_factor,
            decimal_places: item.decimal_places,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
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
   * 単一のランキング項目を取得（キー）
   */
  async getRankingItemByKey(rankingKey: string): Promise<RankingItem | null> {
    try {
      const result = await this.db
        .prepare(
          `SELECT * FROM ranking_items 
          WHERE ranking_key = ? AND is_active = 1`
        )
        .bind(rankingKey)
        .first();

      if (!result) {
        return null;
      }

      return convertRankingItemFromDB(result as unknown as RankingItemDB);
    } catch (error) {
      console.error("Failed to get ranking item by key:", error);
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
    displayOrderInGroup: number
  ): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(QUERIES.updateRankingItemOrder)
        .bind(displayOrderInGroup, id)
        .run();

      return result.success;
    } catch (error) {
      console.error("Failed to update ranking item order:", error);
      throw error;
    }
  }

  /**
   * サブカテゴリのランキンググループを取得
   * グループ化されたランキング項目と、グループに属さない項目を返す
   */
  async getRankingGroupsBySubcategory(
    subcategoryId: string
  ): Promise<RankingGroupResponse | null> {
    try {
      // categories.jsonからサブカテゴリ設定を取得
      const subcategory = findSubcategoryById(subcategoryId);
      if (!subcategory) {
        return null;
      }

      const subcategoryConfig = {
        id: subcategory.id,
        categoryId: subcategory.categoryId,
        name: subcategory.name,
        defaultRankingKey: subcategory.statsDataId || "",
      };

      // 1. グループ情報を取得
      const groupsResult = await this.db
        .prepare(
          `
          SELECT * FROM ranking_groups
          WHERE subcategory_id = ?
          ORDER BY display_order
        `
        )
        .bind(subcategoryId)
        .all();

      const groups: RankingGroup[] = [];

      // 2. 各グループのアイテムを取得
      for (const groupRow of groupsResult.results) {
        const groupDB = groupRow as unknown as RankingGroupDB;

        const itemsResult = await this.db
          .prepare(
            `
            SELECT ri.*
            FROM ranking_items ri
            WHERE ri.group_id = ? AND ri.is_active = 1
            ORDER BY ri.display_order_in_group
          `
          )
          .bind(groupDB.id)
          .all();

        const items = (itemsResult.results || [])
          .map((row) =>
            convertRankingItemFromDB(row as unknown as RankingItemDB)
          )
          .filter((item) => item !== null) as RankingItem[];

        groups.push({
          id: groupDB.id,
          groupKey: groupDB.group_key,
          subcategoryId: groupDB.subcategory_id,
          name: groupDB.name,
          description: groupDB.description || undefined,
          icon: groupDB.icon || undefined,
          displayOrder: groupDB.display_order,
          isCollapsed: Boolean(groupDB.is_collapsed),
          items,
        });
      }

      // 3. グループに属さないアイテムを取得
      const ungroupedItemsResult = await this.db
        .prepare(
          `
          SELECT ri.*
          FROM ranking_items ri
          WHERE ri.group_id IS NULL AND ri.is_active = 1
          ORDER BY ri.display_order_in_group
        `
        )
        .bind()
        .all();

      const ungroupedItems = (ungroupedItemsResult.results || [])
        .map((row) => convertRankingItemFromDB(row as unknown as RankingItemDB))
        .filter((item) => item !== null) as RankingItem[];

      return {
        subcategory: subcategoryConfig,
        groups,
        ungroupedItems,
      };
    } catch (error) {
      console.error("Failed to get ranking groups by subcategory:", error);
      throw error;
    }
  }

  /**
   * 全ランキング項目を取得（管理画面用）
   */
  async getAllRankingItems(): Promise<RankingItem[]> {
    try {
      const result = await this.db
        .prepare(
          `
          SELECT * FROM ranking_items
          ORDER BY created_at DESC
        `
        )
        .all();

      return (result.results || [])
        .map((row) => convertRankingItemFromDB(row as unknown as RankingItemDB))
        .filter((item) => item !== null) as RankingItem[];
    } catch (error) {
      console.error("Failed to get all ranking items:", error);
      throw error;
    }
  }

  /**
   * IDでランキング項目を取得（管理画面用）
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

      return convertRankingItemFromDB(result as unknown as RankingItemDB);
    } catch (error) {
      console.error("Failed to get ranking item by id:", error);
      throw error;
    }
  }

  /**
   * ランキング項目を新規作成（管理画面用）
   */
  async createRankingItem(item: {
    rankingKey: string;
    label: string;
    name: string;
    description?: string;
    unit: string;
    dataSourceId: string;
    mapColorScheme: string;
    mapDivergingMidpoint: string;
    rankingDirection: "asc" | "desc";
    conversionFactor: number;
    decimalPlaces: number;
  }): Promise<RankingItem> {
    try {
      const result = await this.db
        .prepare(
          `
          INSERT INTO ranking_items 
          (
            ranking_key, label, name, description, unit, data_source_id,
            map_color_scheme, map_diverging_midpoint, ranking_direction,
            conversion_factor, decimal_places, is_active,
            created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `
        )
        .bind(
          item.rankingKey,
          item.label,
          item.name,
          item.description || null,
          item.unit,
          item.dataSourceId,
          item.mapColorScheme,
          item.mapDivergingMidpoint,
          item.rankingDirection,
          item.conversionFactor,
          item.decimalPlaces
        )
        .first();

      if (!result) {
        throw new Error("Failed to create ranking item");
      }

      return convertRankingItemFromDB(result as unknown as RankingItemDB);
    } catch (error) {
      console.error("Failed to create ranking item:", error);
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
