/**
 * ランキング関連のSQLクエリ定義
 *
 * 目的:
 * - SQLクエリを一元管理
 * - クエリの再利用性向上
 * - 保守性の向上
 * - テスト容易性の向上
 *
 * 注意:
 * - このファイルは repositories/ ディレクトリに配置されています
 * - サーバー専用のため、公開エクスポートはしません
 */

export const QUERIES = {
  /**
   * サブカテゴリのランキング項目を取得（ranking_groups経由）
   */
  getRankingItemsBySubcategory: `
    SELECT 
      rg.subcategory_id,
      rg.id as group_id,
      rg.name as group_name,
      rg.description as group_description,
      rg.icon as group_icon,
      rg.display_order as group_display_order,
      rg.is_collapsed,
      ri.id,
      ri.ranking_key,
      ri.label,
      ri.unit,
      ri.name as ranking_name,
      ri.is_active,
      ri.group_id,
      ri.display_order_in_group,
      ri.is_featured,
      ri.map_color_scheme,
      ri.map_diverging_midpoint,
      ri.ranking_direction,
      ri.conversion_factor,
      ri.decimal_places,
      ri.created_at,
      ri.updated_at,
      ri.description,
      ri.data_source_id
    FROM ranking_groups rg
    LEFT JOIN ranking_items ri ON rg.id = ri.group_id AND ri.is_active = 1
    WHERE rg.subcategory_id = ?
    ORDER BY rg.display_order, ri.display_order_in_group
  `,

  /**
   * 単一のランキング項目を取得
   */
  getRankingItemById: `
    SELECT * FROM ranking_items WHERE id = ?
  `,

  /**
   * ランキング項目を更新
   */
  updateRankingItem: `
    UPDATE ranking_items 
    SET 
      label = ?,
      map_color_scheme = ?,
      map_diverging_midpoint = ?,
      ranking_direction = ?,
      conversion_factor = ?,
      decimal_places = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  /**
   * ランキング項目を削除（論理削除）
   */
  deleteRankingItem: `
    UPDATE ranking_items 
    SET 
      is_active = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  /**
   * ランキンググループ内のアイテム表示順を更新
   */
  updateRankingItemOrder: `
    UPDATE ranking_items 
    SET 
      display_order_in_group = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  /**
   * ランキング項目のグループIDを更新
   */
  updateRankingItemGroup: `
    UPDATE ranking_items 
    SET 
      group_id = ?,
      display_order_in_group = ?,
      is_featured = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
} as const;

/**
 * クエリの型定義
 */
export type QueryKey = keyof typeof QUERIES;

/**
 * ランキンググループ管理用クエリ
 */
export const GROUP_QUERIES = {
  /**
   * すべてのランキンググループを取得（項目数を含む）
   */
  getAllGroups: `
    SELECT 
      rg.*,
      COUNT(ri.id) as item_count
    FROM ranking_groups rg
    LEFT JOIN ranking_items ri ON rg.id = ri.group_id AND ri.is_active = 1
    GROUP BY rg.id
    ORDER BY rg.subcategory_id, rg.display_order
  `,

  /**
   * ID でランキンググループを取得
   */
  getGroupById: `
    SELECT * FROM ranking_groups WHERE id = ?
  `,

  /**
   * ランキンググループを作成
   */
  createGroup: `
    INSERT INTO ranking_groups 
    (group_key, subcategory_id, name, description, icon, display_order, is_collapsed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,

  /**
   * ランキンググループを更新
   */
  updateGroup: `
    UPDATE ranking_groups 
    SET 
      group_key = ?, 
      name = ?, 
      description = ?, 
      icon = ?, 
      display_order = ?, 
      is_collapsed = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  /**
   * ランキンググループを削除
   */
  deleteGroup: `
    DELETE FROM ranking_groups WHERE id = ?
  `,

  /**
   * グループの表示順を更新
   */
  updateGroupOrder: `
    UPDATE ranking_groups SET display_order = ? WHERE id = ?
  `,

  /**
   * 項目をグループに割り当て
   */
  assignItemToGroup: `
    UPDATE ranking_items 
    SET 
      group_id = ?, 
      display_order_in_group = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  /**
   * 項目をグループから削除
   */
  removeItemFromGroup: `
    UPDATE ranking_items 
    SET 
      group_id = NULL, 
      display_order_in_group = 0, 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
} as const;

/**
 * グループクエリの型定義
 */
export type GroupQueryKey = keyof typeof GROUP_QUERIES;
