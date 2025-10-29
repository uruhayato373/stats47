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
      rg.group_key,
      rg.name as group_name,
      rg.description as group_description,
      rg.icon as group_icon,
      rg.display_order as group_display_order,
      rg.is_collapsed,
      ri.ranking_key,
      ri.label,
      ri.unit,
      ri.name as ranking_name,
      ri.is_active,
      ri.group_key,
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
    LEFT JOIN ranking_items ri ON rg.group_key = ri.group_key AND ri.is_active = 1
    WHERE rg.subcategory_id = ?
    ORDER BY rg.display_order, ri.display_order_in_group
  `,

  /**
   * 単一のランキング項目を取得（非推奨：getRankingItemByKey を使用）
   * @deprecated このクエリは使用されません。getRankingItemByKeyを使用してください。
   */
  getRankingItemById: `
    SELECT * FROM ranking_items WHERE ranking_key = ?
  `,

  /**
   * ランキングキーで単一のランキング項目を取得
   */
  getRankingItemByKey: `
    SELECT * FROM ranking_items WHERE ranking_key = ? AND is_active = 1
  `,

  /**
   * ランキングキーでデータソースメタデータを取得
   */
  getDataSourceMetadataByKey: `
    SELECT * FROM data_source_metadata WHERE ranking_key = ?
  `,

  /**
   * ランキング項目を更新
   */
  updateRankingItem: `
    UPDATE ranking_items 
    SET 
      label = ?,
      name = ?,
      description = ?,
      unit = ?,
      data_source_id = ?,
      map_color_scheme = ?,
      map_diverging_midpoint = ?,
      ranking_direction = ?,
      conversion_factor = ?,
      decimal_places = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ?
  `,

  /**
   * ランキング項目を削除（論理削除）
   */
  deleteRankingItem: `
    UPDATE ranking_items 
    SET 
      is_active = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ?
  `,

  /**
   * ランキンググループ内のアイテム表示順を更新
   */
  updateRankingItemOrder: `
    UPDATE ranking_items 
    SET 
      display_order_in_group = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ?
  `,

  /**
   * ランキング項目のグループキーを更新
   */
  updateRankingItemGroup: `
    UPDATE ranking_items 
    SET 
      group_key = ?,
      display_order_in_group = ?,
      is_featured = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ?
  `,

  /**
   * データソースメタデータを作成
   */
  createDataSourceMetadata: `
    INSERT INTO data_source_metadata 
    (ranking_key, data_source_id, area_type, calculation_type, metadata)
    VALUES (?, ?, ?, ?, ?)
  `,

  /**
   * データソースメタデータを更新
   */
  updateDataSourceMetadata: `
    UPDATE data_source_metadata 
    SET 
      calculation_type = ?,
      metadata = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ? AND data_source_id = ? AND area_type = ?
  `,

  /**
   * ランキングキーでデータソースメタデータを削除
   */
  deleteDataSourceMetadataByRankingKey: `
    DELETE FROM data_source_metadata WHERE ranking_key = ?
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
      COUNT(ri.ranking_key) as item_count
    FROM ranking_groups rg
    LEFT JOIN ranking_items ri ON rg.group_key = ri.group_key AND ri.is_active = 1
    GROUP BY rg.group_key
    ORDER BY rg.subcategory_id, rg.display_order
  `,

  /**
   * group_key でランキンググループを取得
   */
  getGroupByKey: `
    SELECT * FROM ranking_groups WHERE group_key = ?
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
      name = ?, 
      description = ?, 
      icon = ?, 
      display_order = ?, 
      is_collapsed = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE group_key = ?
  `,

  /**
   * ランキンググループを削除
   */
  deleteGroup: `
    DELETE FROM ranking_groups WHERE group_key = ?
  `,

  /**
   * グループの表示順を更新
   */
  updateGroupOrder: `
    UPDATE ranking_groups SET display_order = ? WHERE group_key = ?
  `,

  /**
   * 項目をグループに割り当て
   */
  assignItemToGroup: `
    UPDATE ranking_items 
    SET 
      group_key = ?, 
      display_order_in_group = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ?
  `,

  /**
   * 項目をグループから削除
   */
  removeItemFromGroup: `
    UPDATE ranking_items 
    SET 
      group_key = NULL, 
      display_order_in_group = 0, 
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ?
  `,
} as const;

/**
 * グループクエリの型定義
 */
export type GroupQueryKey = keyof typeof GROUP_QUERIES;
