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
   * カテゴリキーで検索（PRIMARY KEY）
   */
  findCategoryByName: `SELECT * FROM categories WHERE category_key = ?`,

  /**
   * カテゴリを作成
   */
  createCategory: `INSERT INTO categories (category_key, category_name, icon, display_order)
                   VALUES (?, ?, ?, ?)`,

  /**
   * カテゴリを更新
   */
  updateCategory: `UPDATE categories SET {fields} WHERE category_key = ?`,

  /**
   * カテゴリを削除
   */
  deleteCategory: `DELETE FROM categories WHERE category_key = ?`,
} as const;

/**
 * サブカテゴリテーブルのクエリ
 */
export const SUBCATEGORY_QUERIES = {
  /**
   * 全サブカテゴリを取得
   */
  listSubcategories: `SELECT * FROM subcategories ORDER BY category_key, display_order`,

  /**
   * カテゴリキーでサブカテゴリを検索
   */
  findSubcategoriesByCategory: `SELECT * FROM subcategories 
                                 WHERE category_key = ? 
                                 ORDER BY display_order`,

  /**
   * サブカテゴリキーで検索（PRIMARY KEY）
   */
  findSubcategoryByName: `SELECT * FROM subcategories WHERE subcategory_key = ?`,

  /**
   * サブカテゴリを作成
   */
  createSubcategory: `INSERT INTO subcategories (subcategory_key, subcategory_name, category_key, display_order)
                       VALUES (?, ?, ?, ?)`,

  /**
   * サブカテゴリを更新
   */
  updateSubcategory: `UPDATE subcategories SET {fields} WHERE subcategory_key = ?`,

  /**
   * サブカテゴリを削除
   */
  deleteSubcategory: `DELETE FROM subcategories WHERE subcategory_key = ?`,
} as const;
