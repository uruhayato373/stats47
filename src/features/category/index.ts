/**
 * Category Domain 統一エクスポート
 * カテゴリ管理機能を提供
 */

// ============================================================================
// 型定義
// ============================================================================
export interface Category {
  categoryName: string;
  name: string;
  icon?: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  subcategoryName: string;
  name: string;
  categoryName?: string; // 親カテゴリ名（オプショナル）
}

// ============================================================================
// ユーティリティ
// ============================================================================
export * from "./utils";

// ============================================================================
// サービス
// ============================================================================

/**
 * カテゴリ一覧を取得
 */
export function listCategories(): Category[] {
  const categoriesData = require("@/config/categories.json");
  return categoriesData.default || categoriesData;
}

/**
 * 全サブカテゴリを取得
 */
export async function getSubcategories(): Promise<Subcategory[]> {
  const categories = listCategories();
  return categories.flatMap((category) =>
    category.subcategories.map((sub) => ({
      ...sub,
      categoryName: category.categoryName,
    }))
  );
}

/**
 * サブカテゴリ名でサブカテゴリを検索
 */
export function findSubcategoryByName(
  subcategoryName: string
): Subcategory | null {
  const categories = listCategories();

  for (const category of categories) {
    const subcategory = category.subcategories.find(
      (sub) => sub.subcategoryName === subcategoryName
    );
    if (subcategory) {
      return subcategory;
    }
  }

  return null;
}
