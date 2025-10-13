/**
 * ランキング関連のSQLクエリ定義
 *
 * 目的:
 * - SQLクエリを一元管理
 * - クエリの再利用性向上
 * - 保守性の向上
 * - テスト容易性の向上
 */

export const QUERIES = {
  /**
   * サブカテゴリのランキング項目を取得
   * サブカテゴリ設定とランキング項目を結合して取得（可視化設定も含む）
   */
  getRankingItemsBySubcategory: `
    SELECT 
      sc.id as subcategory_id,
      sc.category_id,
      sc.name as subcategory_name,
      sc.description,
      sc.default_ranking_key,
      ri.id,
      ri.ranking_key,
      ri.label,
      ri.stats_data_id,
      ri.cd_cat01,
      ri.unit,
      ri.name as ranking_name,
      ri.display_order,
      ri.is_active,
      ri.map_color_scheme,
      ri.map_diverging_midpoint,
      ri.ranking_direction,
      ri.conversion_factor,
      ri.decimal_places,
      ri.created_at,
      ri.updated_at
    FROM subcategory_configs sc
    LEFT JOIN ranking_items ri ON sc.id = ri.subcategory_id AND ri.is_active = 1
    WHERE sc.id = ?
    ORDER BY ri.display_order
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
   * ランキング項目を作成
   */
  createRankingItem: `
    INSERT INTO ranking_items (
      subcategory_id,
      ranking_key,
      label,
      stats_data_id,
      cd_cat01,
      unit,
      name,
      display_order,
      is_active,
      map_color_scheme,
      map_diverging_midpoint,
      ranking_direction,
      conversion_factor,
      decimal_places,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
   * サブカテゴリの全ランキング項目を取得（削除済みも含む）
   */
  getAllRankingItemsBySubcategory: `
    SELECT 
      ri.*,
      sc.name as subcategory_name
    FROM ranking_items ri
    JOIN subcategory_configs sc ON ri.subcategory_id = sc.id
    WHERE ri.subcategory_id = ?
    ORDER BY ri.display_order
  `,

  /**
   * ランキング項目の表示順序を更新
   */
  updateRankingItemOrder: `
    UPDATE ranking_items 
    SET 
      display_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
} as const;

/**
 * クエリの型定義
 */
export type QueryKey = keyof typeof QUERIES;
