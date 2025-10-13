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
   * サブカテゴリのランキング項目を取得（新スキーマ対応）
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
      ri.unit,
      ri.name as ranking_name,
      sri.display_order,
      ri.is_active,
      ri.map_color_scheme,
      ri.map_diverging_midpoint,
      ri.ranking_direction,
      ri.conversion_factor,
      ri.decimal_places,
      ri.created_at,
      ri.updated_at,
      -- e-Stat固有情報を取得
      dsm.metadata as metadata_json
    FROM subcategory_configs sc
    LEFT JOIN subcategory_ranking_items sri ON sc.id = sri.subcategory_id
    LEFT JOIN ranking_items ri ON sri.ranking_item_id = ri.id AND ri.is_active = 1
    LEFT JOIN data_source_metadata dsm ON ri.id = dsm.ranking_item_id AND dsm.data_source_id = 'estat'
    WHERE sc.id = ?
    ORDER BY sri.display_order
  `,

  /**
   * 単一のランキング項目を取得（新スキーマ対応）
   */
  getRankingItemById: `
    SELECT 
      ri.*,
      json_extract(dsm.metadata, '$.stats_data_id') as stats_data_id,
      json_extract(dsm.metadata, '$.cd_cat01') as cd_cat01
    FROM ranking_items ri
    LEFT JOIN data_source_metadata dsm ON ri.id = dsm.ranking_item_id AND dsm.data_source_id = 'estat'
    WHERE ri.id = ?
  `,

  /**
   * ランキング項目を更新（新スキーマ対応）
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
   * ランキング項目を削除（論理削除）（新スキーマ対応）
   */
  deleteRankingItem: `
    UPDATE ranking_items 
    SET 
      is_active = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  /**
   * サブカテゴリの全ランキング項目を取得（削除済みも含む）（新スキーマ対応）
   */
  getAllRankingItemsBySubcategory: `
    SELECT 
      ri.*,
      sc.name as subcategory_name,
      json_extract(dsm.metadata, '$.stats_data_id') as stats_data_id,
      json_extract(dsm.metadata, '$.cd_cat01') as cd_cat01
    FROM ranking_items ri
    JOIN subcategory_ranking_items sri ON ri.id = sri.ranking_item_id
    JOIN subcategory_configs sc ON sri.subcategory_id = sc.id
    LEFT JOIN data_source_metadata dsm ON ri.id = dsm.ranking_item_id AND dsm.data_source_id = 'estat'
    WHERE sri.subcategory_id = ?
    ORDER BY sri.display_order
  `,

  /**
   * ランキング項目の表示順序を更新（新スキーマ対応）
   */
  updateRankingItemOrder: `
    UPDATE subcategory_ranking_items 
    SET 
      display_order = ?
    WHERE ranking_item_id = ?
  `,
} as const;

/**
 * クエリの型定義
 */
export type QueryKey = keyof typeof QUERIES;
