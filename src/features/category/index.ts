/**
 * Category Domain 統一エクスポート
 * カテゴリ管理機能を提供
 */

// ============================================================================
// 型定義
// ============================================================================
export interface Category {
  id: string; // URLパスで使用される識別子（categoryNameと同じ値）
  categoryName: string;
  name: string;
  icon?: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string; // URLパスで使用される識別子（subcategoryNameと同じ値）
  subcategoryName: string;
  name: string;
  categoryName?: string; // 親カテゴリ名（オプショナル）
}

// ============================================================================
// ユーティリティ
// ============================================================================
export * from "./utils";

// ============================================================================
// 注意点（Server Actions）
// ============================================================================
// Server Action はバレル越しの再エクスポートを避け、
// `@/features/category/actions` から直接 import してください。
// 例: `import { listCategoriesAction } from "@/features/category/actions";`

// ============================================================================
// 既存（レガシー）ユーティリティ的関数（必要に応じて段階的削除）
// ============================================================================
/**
 * カテゴリ一覧を取得
 */
export function listCategories(): Category[] {
  const categoriesData = require("@/config/categories.json");
  const rawCategories = categoriesData.default || categoriesData;
  
  // categories.jsonの構造（id/name）をCategoryインターフェース（categoryName/subcategoryName）に変換
  return rawCategories.map((cat: any) => {
    const categoryName = cat.id || cat.categoryName || "";
    return {
      id: categoryName, // URLパス用のidプロパティを追加
      categoryName: categoryName,
      name: cat.name || "",
      icon: cat.icon,
      subcategories: (cat.subcategories || []).map((sub: any) => {
        const subcategoryName = sub.id || sub.subcategoryName || "";
        return {
          id: subcategoryName, // URLパス用のidプロパティを追加
          subcategoryName: subcategoryName,
          name: sub.name || "",
          categoryName: categoryName,
        };
      }),
    };
  });
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
    // listCategories()で既に変換されているので、そのままsubcategoryNameで検索
    const subcategory = category.subcategories.find(
      (sub) => sub.subcategoryName === subcategoryName
    );
    if (subcategory) {
      return subcategory;
    }
  }

  return null;
}
