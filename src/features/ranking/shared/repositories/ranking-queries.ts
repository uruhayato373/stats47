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
      rgs.subcategory_id,
      rg.group_key,
      rg.group_name,
      rg.label as group_label,
      rg.display_order as group_display_order,
      ri.ranking_key,
      ri.area_type,
      ri.label,
      ri.unit,
      ri.ranking_name,
      ri.is_active,
      ri.group_key,
      ri.display_order_in_group,
      ri.map_color_scheme,
      ri.map_diverging_midpoint,
      ri.ranking_direction,
      ri.conversion_factor,
      ri.decimal_places,
      ri.created_at,
      ri.updated_at,
      ri.annotation
    FROM ranking_group_subcategories rgs
    INNER JOIN ranking_groups rg ON rgs.group_key = rg.group_key
    LEFT JOIN ranking_items ri ON rg.group_key = ri.group_key AND ri.is_active = 1
    WHERE rgs.subcategory_id = ?
    ORDER BY rgs.display_order, rg.display_order, ri.display_order_in_group
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
   * ランキング項目を更新
   * @deprecated このクエリは使用されません。
   * RankingRepository.updateRankingItem() で動的にUPDATE文を構築しています。
   * 
   * 理由:
   * - 部分更新に対応できない
   * - 0や空文字列などのfalsyな値が正しく処理されない
   * 
   * @see Issue #12: ranking_items データベース更新エラーの調査結果
   */
  updateRankingItem: `
    UPDATE ranking_items 
    SET 
      label = ?,
      ranking_name = ?,
      annotation = ?,
      unit = ?,
      is_active = ?,
      map_color_scheme = ?,
      map_diverging_midpoint = ?,
      ranking_direction = ?,
      conversion_factor = ?,
      decimal_places = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ? AND area_type = ?
  `,

  /**
   * ランキング項目を削除（論理削除）
   */
  deleteRankingItem: `
    UPDATE ranking_items 
    SET 
      is_active = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ? AND area_type = ?
  `,

  /**
   * ランキンググループ内のアイテム表示順を更新
   */
  updateRankingItemOrder: `
    UPDATE ranking_items 
    SET 
      display_order_in_group = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ? AND area_type = ?
  `,

  /**
   * ランキング項目のグループキーを更新
   */
  updateRankingItemGroup: `
    UPDATE ranking_items 
    SET 
      group_key = ?,
      display_order_in_group = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ? AND area_type = ?
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
    ORDER BY rg.display_order
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
    (group_key, group_name, label, display_order)
    VALUES (?, ?, ?, ?)
  `,

  /**
   * ランキンググループを更新
   */
  updateGroup: `
    UPDATE ranking_groups 
    SET 
      group_name = ?, 
      label = ?,
      display_order = ?, 
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

  /**
   * グループのサブカテゴリ一覧を取得
   */
  getGroupSubcategories: `
    SELECT * FROM ranking_group_subcategories
    WHERE group_key = ?
    ORDER BY display_order, created_at
  `,

  /**
   * グループにサブカテゴリを追加
   */
  addSubcategoryToGroup: `
    INSERT INTO ranking_group_subcategories
    (group_key, subcategory_id, display_order)
    VALUES (?, ?, ?)
    ON CONFLICT(group_key, subcategory_id) DO NOTHING
  `,

  /**
   * グループからサブカテゴリを削除
   */
  removeSubcategoryFromGroup: `
    DELETE FROM ranking_group_subcategories
    WHERE group_key = ? AND subcategory_id = ?
  `,

  /**
   * グループのサブカテゴリを一括更新（既存を削除して新しいものを挿入）
   */
  deleteAllGroupSubcategories: `
    DELETE FROM ranking_group_subcategories
    WHERE group_key = ?
  `,
} as const;

/**
 * グループクエリの型定義
 */
export type GroupQueryKey = keyof typeof GROUP_QUERIES;

