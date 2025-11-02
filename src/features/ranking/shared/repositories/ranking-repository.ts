/**
 * ランキング関連のデータベースアクセス層
 *
 * 目的:
 * - データベースアクセスロジックをカプセル化
 * - 型安全なデータベース操作
 * - エラーハンドリングの統一
 * - テスト容易性の向上
 */

import { findSubcategoryByName } from "@/features/category";

import { buildEnvironmentConfig } from "@/lib/environment";

import { getD1 } from "../db/d1";

import { convertRankingItemFromDB } from "../converters/ranking-converters";
import type { RankingItem, RankingItemDB } from "../../items/types";
import type {
  CreateRankingGroupInput,
  RankingGroup,
  RankingGroupDB,
  RankingGroupResponse,
  UpdateRankingGroupInput,
} from "../../groups/types";

import { GROUP_QUERIES, QUERIES } from "./ranking-queries";

export interface SubcategoryConfig {
  id: string;
  categoryId: string;
  name: string;
  subcategoryName?: string;
  categoryName?: string;
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
    const db = getD1();
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
      // Development/Staging/Production環境: データベースから取得
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
   * @deprecated このメソッドは使用されません。設計によりR2ストレージを使用します。
   * ランキング値データは R2 Storage に JSON 形式で保存されます。
   */
  async fetchRankingValues(options?: {
    limit?: number;
    rankingKey?: string;
  }): Promise<any[]> {
    console.warn(
      "[DEPRECATED] fetchRankingValues() は使用されません。R2 ストレージを使用してください。"
    );
    return [];
  }

  /**
   * サブカテゴリのランキング項目を取得
   */
  async getRankingItemsBySubcategory(
    subcategoryId: string
  ): Promise<RankingConfigResponse | null> {
    try {
      // categories.jsonからサブカテゴリ設定を取得
      const subcategory = findSubcategoryByName(subcategoryId);
      if (!subcategory) {
        return null;
      }

      const subcategoryConfig: SubcategoryConfig = {
        id: subcategory.subcategoryName,
        categoryId: subcategory.categoryName || "",
        name: subcategory.name,
        subcategoryName: subcategory.subcategoryName,
        categoryName: subcategory.categoryName,
        defaultRankingKey: "",
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
        defaultRankingKey: defaultRankingKey || "",
      };

      // ランキング項目を取得（ranking_nameをnameに変換）
      const rankingItems = rows
        .filter((row) => row.ranking_key)
        .map((row) => {
          const item = row as any;
          const dbItem: RankingItemDB = {
            ranking_key: item.ranking_key,
            area_type: item.area_type || "prefecture",
            label: item.label,
            ranking_name: item.ranking_name,
            annotation: item.annotation,
            unit: item.unit,
            map_color_scheme: item.map_color_scheme,
            map_diverging_midpoint: item.map_diverging_midpoint,
            ranking_direction: item.ranking_direction,
            conversion_factor: item.conversion_factor,
            decimal_places: item.decimal_places,
            is_active: item.is_active,
            group_key: item.group_key || null,
            display_order_in_group: item.display_order_in_group || 0,
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
   * 単一のランキング項目を取得（キーと地域タイプ）
   * メタデータも同時に取得する
   */
  async getRankingItemByKeyAndAreaType(
    rankingKey: string,
    areaType: "prefecture" | "city" | "national"
  ): Promise<RankingItem | null> {
    try {
      // ランキング項目を取得
      const itemResult = await this.db
        .prepare(
          `SELECT * FROM ranking_items 
          WHERE ranking_key = ? AND area_type = ? AND is_active = 1`
        )
        .bind(rankingKey, areaType)
        .first();

      if (!itemResult) {
        return null;
      }

      const item = convertRankingItemFromDB(
        itemResult as unknown as RankingItemDB
      );

      return item;
    } catch (error) {
      console.error("Failed to get ranking item by key and area type:", error);
      throw error;
    }
  }

  /**
   * 単一のランキング項目を取得（キーのみ、互換性のため）
   * @deprecated getRankingItemByKeyAndAreaTypeを使用してください
   * 注意: 複合主キーになったため、ranking_keyのみでは複数の結果が返る可能性があります
   */
  async getRankingItemByKey(rankingKey: string): Promise<RankingItem | null> {
    try {
      // 最初の一致するアイテムを取得（prefectureを優先）
      const itemResult = await this.db
        .prepare(
          `SELECT * FROM ranking_items 
          WHERE ranking_key = ? AND is_active = 1
          ORDER BY 
            CASE area_type 
              WHEN 'prefecture' THEN 1
              WHEN 'city' THEN 2
              WHEN 'national' THEN 3
            END
          LIMIT 1`
        )
        .bind(rankingKey)
        .first();

      if (!itemResult) {
        return null;
      }

      const item = convertRankingItemFromDB(
        itemResult as unknown as RankingItemDB
      );

      return item;
    } catch (error) {
      console.error("Failed to get ranking item by key:", error);
      throw error;
    }
  }

  /**
   * ランキング項目を更新
   */
  async updateRankingItem(
    rankingKey: string,
    areaType: "prefecture" | "city" | "national",
    updates: {
      label?: string;
      name?: string;
      annotation?: string;
      unit?: string;
      isActive?: boolean;
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
          updates.label || null,
          updates.name || null,
          updates.annotation || null,
          updates.unit || null,
          updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : null,
          updates.mapColorScheme || null,
          updates.mapDivergingMidpoint || null,
          updates.rankingDirection || null,
          updates.conversionFactor || null,
          updates.decimalPlaces || null,
          rankingKey,
          areaType
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
  async deleteRankingItem(
    rankingKey: string,
    areaType: "prefecture" | "city" | "national"
  ): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(QUERIES.deleteRankingItem)
        .bind(rankingKey, areaType)
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
    rankingKey: string,
    areaType: "prefecture" | "city" | "national",
    displayOrderInGroup: number
  ): Promise<boolean> {
    try {
      const result = await this.db
        .prepare(QUERIES.updateRankingItemOrder)
        .bind(displayOrderInGroup, rankingKey, areaType)
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
      const subcategory = findSubcategoryByName(subcategoryId);
      if (!subcategory) {
        return null;
      }

      const subcategoryConfig = {
        id: subcategory.subcategoryName,
        categoryId: subcategory.categoryName || "",
        name: subcategory.name,
        subcategoryName: subcategory.subcategoryName,
        categoryName: subcategory.categoryName,
        defaultRankingKey: "",
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
            WHERE ri.group_key = ? AND ri.is_active = 1
            ORDER BY ri.display_order_in_group
          `
          )
          .bind(groupDB.group_key)
          .all();

        const items = (itemsResult.results || [])
          .map((row) =>
            convertRankingItemFromDB(row as unknown as RankingItemDB)
          )
          .filter((item) => item !== null) as RankingItem[];

        groups.push({
          groupKey: groupDB.group_key,
          subcategoryId: groupDB.subcategory_id,
          name: groupDB.group_name,
          label: groupDB.label || undefined,
          icon: groupDB.icon || undefined,
          displayOrder: groupDB.display_order,
          items,
        });
      }

      // 3. グループに属さないアイテムを取得
      const ungroupedItemsResult = await this.db
        .prepare(
          `
          SELECT ri.*
          FROM ranking_items ri
          WHERE ri.group_key IS NULL AND ri.is_active = 1
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
   * @deprecated getRankingItemByKeyを使用してください
   */
  async getRankingItemById(id: number): Promise<RankingItem | null> {
    // IDは使用されないので、空の値でキー検索を試みる
    return this.getRankingItemByKey(String(id));
  }

  /**
   * ランキング項目を新規作成（管理画面用）
   */
  async createRankingItem(item: {
    rankingKey: string;
    areaType: "prefecture" | "city" | "national";
    label: string;
    ranking_name: string;
    annotation?: string;
    unit: string;
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
            ranking_key, area_type, label, ranking_name, annotation, unit,
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
          item.areaType,
          item.label,
          item.ranking_name,
          item.annotation || null,
          item.unit,
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

  // ============================================================
  // ランキンググループ管理メソッド
  // ============================================================

  /**
   * すべてのランキンググループを取得
   */
  async getAllRankingGroups(): Promise<RankingGroup[]> {
    try {
      const result = await this.db.prepare(GROUP_QUERIES.getAllGroups).all();
      const items = (await this.getAllRankingItems()).filter((i) => i.groupKey);

      return (result.results || []).map((row: any) => {
        const groupDB = row as unknown as RankingGroupDB;
        const groupItems = items.filter(
          (i) => i.groupKey === groupDB.group_key
        );

        return {
          groupKey: groupDB.group_key,
          subcategoryId: groupDB.subcategory_id,
          name: groupDB.group_name,
          label: groupDB.label || undefined,
          icon: groupDB.icon || undefined,
          displayOrder: groupDB.display_order,
          items: groupItems.sort(
            (a, b) =>
              (a.displayOrderInGroup || 0) - (b.displayOrderInGroup || 0)
          ),
        };
      });
    } catch (error) {
      console.error("Failed to get all ranking groups:", error);
      throw error;
    }
  }

  /**
   * group_keyでランキンググループを取得
   */
  async getRankingGroupByKey(groupKey: string): Promise<RankingGroup | null> {
    try {
      const result = await this.db
        .prepare(GROUP_QUERIES.getGroupByKey)
        .bind(groupKey)
        .first();

      if (!result) {
        return null;
      }

      const groupDB = result as unknown as RankingGroupDB;
      const items = (await this.getAllRankingItems())
        .filter((i) => i.groupKey === groupKey)
        .sort(
          (a, b) => (a.displayOrderInGroup || 0) - (b.displayOrderInGroup || 0)
        );

      return {
        groupKey: groupDB.group_key,
        subcategoryId: groupDB.subcategory_id,
        name: groupDB.group_name,
        label: groupDB.label || undefined,
        icon: groupDB.icon || undefined,
        displayOrder: groupDB.display_order,
        items,
      };
    } catch (error) {
      console.error("Failed to get ranking group by key:", error);
      throw error;
    }
  }

  /**
   * ランキンググループを作成
   */
  async createRankingGroup(data: CreateRankingGroupInput): Promise<string> {
    try {
      await this.db
        .prepare(GROUP_QUERIES.createGroup)
        .bind(
          data.groupKey,
          data.subcategoryId,
          data.group_name,
          data.label || null,
          data.icon || null,
          data.displayOrder
        )
        .run();

      return data.groupKey;
    } catch (error) {
      console.error("Failed to create ranking group:", error);
      throw error;
    }
  }

  /**
   * ランキンググループを更新
   */
  async updateRankingGroup(
    groupKey: string,
    data: UpdateRankingGroupInput
  ): Promise<void> {
    try {
      // 既存のグループを取得してから更新
      const group = await this.getRankingGroupByKey(groupKey);
      if (!group) {
        throw new Error("Ranking group not found");
      }

      await this.db
        .prepare(GROUP_QUERIES.updateGroup)
        .bind(
          data.group_name ?? group.name,
          data.label ?? group.label ?? null,
          data.icon ?? group.icon ?? null,
          data.displayOrder ?? group.displayOrder,
          groupKey
        )
        .run();
    } catch (error) {
      console.error("Failed to update ranking group:", error);
      throw error;
    }
  }

  /**
   * ランキンググループを削除
   */
  async deleteRankingGroup(groupKey: string): Promise<void> {
    try {
      // グループに属する項目のgroup_keyをNULLにする
      await this.db
        .prepare(
          `UPDATE ranking_items 
           SET group_key = NULL, display_order_in_group = 0, updated_at = CURRENT_TIMESTAMP
           WHERE group_key = ?`
        )
        .bind(groupKey)
        .run();

      // グループを削除
      await this.db.prepare(GROUP_QUERIES.deleteGroup).bind(groupKey).run();
    } catch (error) {
      console.error("Failed to delete ranking group:", error);
      throw error;
    }
  }

  /**
   * グループの表示順を更新
   */
  async updateGroupDisplayOrder(
    groupKey: string,
    newOrder: number
  ): Promise<void> {
    try {
      await this.db
        .prepare(GROUP_QUERIES.updateGroupOrder)
        .bind(newOrder, groupKey)
        .run();
    } catch (error) {
      console.error("Failed to update group display order:", error);
      throw error;
    }
  }

  /**
   * 項目をグループに割り当て
   */
  async assignItemsToGroup(
    groupKey: string,
    itemKeys: string[],
    orders: number[]
  ): Promise<void> {
    try {
      for (let i = 0; i < itemKeys.length; i++) {
        await this.db
          .prepare(GROUP_QUERIES.assignItemToGroup)
          .bind(groupKey, orders[i], itemKeys[i])
          .run();
      }
    } catch (error) {
      console.error("Failed to assign items to group:", error);
      throw error;
    }
  }

  /**
   * 項目をグループから削除
   */
  async removeItemsFromGroup(itemKeys: string[]): Promise<void> {
    try {
      for (const itemKey of itemKeys) {
        await this.db
          .prepare(GROUP_QUERIES.removeItemFromGroup)
          .bind(itemKey)
          .run();
      }
    } catch (error) {
      console.error("Failed to remove items from group:", error);
      throw error;
    }
  }

  /**
   * グループ内の項目の表示順を更新
   */
  async updateItemDisplayOrderInGroup(
    rankingKey: string,
    areaType: "prefecture" | "city" | "national",
    newOrder: number
  ): Promise<void> {
    try {
      await this.db
        .prepare(QUERIES.updateRankingItemOrder)
        .bind(newOrder, rankingKey, areaType)
        .run();
    } catch (error) {
      console.error("Failed to update item display order in group:", error);
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

