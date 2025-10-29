/**
 * カテゴリ関連のSQLクエリ定義
 *
 * 目的:
 * - SQLクエリを一元管理
 * - クエリの再利用性向上
 * - 保守性の向上
 */

/**
 * カテゴリテーブルのクエリ
 */
export const CATEGORY_QUERIES = {
  /**
   * 全カテゴリを取得（表示順序でソート）
   */
  listCategories: `SELECT * FROM categories ORDER BY display_order`,

  /**
   * カテゴリIDで検索
   */
  findCategoryById: `SELECT * FROM categories WHERE id = ?`,

  /**
   * カテゴリキーで検索
   */
  findCategoryByKey: `SELECT * FROM categories WHERE category_key = ?`,

  /**
   * カテゴリを作成
   */
  createCategory: `INSERT INTO categories (category_key, name, icon, display_order)
                   VALUES (?, ?, ?, ?)`,

  /**
   * カテゴリを更新
   */
  updateCategory: `UPDATE categories SET {fields} WHERE id = ?`,

  /**
   * カテゴリを削除
   */
  deleteCategory: `DELETE FROM categories WHERE id = ?`,
} as const;

/**
 * サブカテゴリテーブルのクエリ
 */
export const SUBCATEGORY_QUERIES = {
  /**
   * 全サブカテゴリを取得
   */
  listSubcategories: `SELECT * FROM subcategories ORDER BY category_id, display_order`,

  /**
   * カテゴリIDでサブカテゴリを検索
   */
  findSubcategoriesByCategory: `SELECT * FROM subcategories 
                                 WHERE category_id = ? 
                                 ORDER BY display_order`,

  /**
   * サブカテゴリIDで検索
   */
  findSubcategoryById: `SELECT * FROM subcategories WHERE id = ?`,

  /**
   * サブカテゴリキーで検索
   */
  findSubcategoryByKey: `SELECT * FROM subcategories WHERE subcategory_key = ?`,

  /**
   * サブカテゴリを作成
   */
  createSubcategory: `INSERT INTO subcategories (subcategory_key, name, category_id, href, display_order)
                       VALUES (?, ?, ?, ?, ?)`,

  /**
   * サブカテゴリを更新
   */
  updateSubcategory: `UPDATE subcategories SET {fields} WHERE id = ?`,

  /**
   * サブカテゴリを削除
   */
  deleteSubcategory: `DELETE FROM subcategories WHERE id = ?`,
} as const;
