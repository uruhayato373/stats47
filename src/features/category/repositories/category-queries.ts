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
   * カテゴリ名で検索（PRIMARY KEY）
   */
  findCategoryByName: `SELECT * FROM categories WHERE category_name = ?`,

  /**
   * カテゴリを作成
   */
  createCategory: `INSERT INTO categories (category_name, name, icon, display_order)
                   VALUES (?, ?, ?, ?)`,

  /**
   * カテゴリを更新
   */
  updateCategory: `UPDATE categories SET {fields} WHERE category_name = ?`,

  /**
   * カテゴリを削除
   */
  deleteCategory: `DELETE FROM categories WHERE category_name = ?`,
} as const;

/**
 * サブカテゴリテーブルのクエリ
 */
export const SUBCATEGORY_QUERIES = {
  /**
   * 全サブカテゴリを取得
   */
  listSubcategories: `SELECT * FROM subcategories ORDER BY category_name, display_order`,

  /**
   * カテゴリ名でサブカテゴリを検索
   */
  findSubcategoriesByCategory: `SELECT * FROM subcategories 
                                 WHERE category_name = ? 
                                 ORDER BY display_order`,

  /**
   * サブカテゴリ名で検索（PRIMARY KEY）
   */
  findSubcategoryByName: `SELECT * FROM subcategories WHERE subcategory_name = ?`,

  /**
   * サブカテゴリを作成
   */
  createSubcategory: `INSERT INTO subcategories (subcategory_name, name, category_name, display_order)
                       VALUES (?, ?, ?, ?)`,

  /**
   * サブカテゴリを更新
   */
  updateSubcategory: `UPDATE subcategories SET {fields} WHERE subcategory_name = ?`,

  /**
   * サブカテゴリを削除
   */
  deleteSubcategory: `DELETE FROM subcategories WHERE subcategory_name = ?`,
} as const;
