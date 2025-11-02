/**
 * Category Domain 統一エクスポート
 *
 * カテゴリ・サブカテゴリ管理機能を提供するドメインの統一エクスポート。
 * 型定義、ユーティリティ関数、レガシー関数のすべてを再エクスポートする。
 *
 * ## エクスポート内容
 * - **型定義**: カテゴリ、サブカテゴリの型定義
 * - **ユーティリティ**: カテゴリアイコン取得関数など
 * - **レガシー関数**: 既存のカテゴリ取得関数（段階的削除予定）
 *
 * ## 注意事項
 * - Server Actions は manifest 解決の安定性の観点から、
 *   このバレル（index.ts）越しの再エクスポートを避け、
 *   呼び出し側は `@/features/category/actions` を直接 import してください。
 *
 * @module CategoryDomain
 *
 * @example
 * ```ts
 * // 型定義のインポート
 * import type { Category, Subcategory } from "@/features/category";
 *
 * // ユーティリティ関数のインポート
 * import { getCategoryIcon } from "@/features/category";
 *
 * // Server Actions は直接インポート（推奨）
 * import { listCategoriesAction } from "@/features/category/actions";
 * ```
 */

import categoriesData from "@/config/categories.json";

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

export * from "./utils";

/**
 * カテゴリ一覧を取得（レガシー関数）
 *
 * ⚠️ **注意**: この関数は既存コードとの互換性のために残されていますが、
 * 段階的に削除する予定です。新しいコードでは `@/features/category/actions` の
 * `listCategoriesAction` を使用してください。
 *
 * @returns {Category[]} カテゴリの配列
 *
 * @deprecated 新しいコードでは `listCategoriesAction` を使用してください
 */
export function listCategories(): Category[] {
  const rawCategories = Array.isArray(categoriesData) ? categoriesData : [];

  // categories.jsonの構造（id/name）をCategoryインターフェース（categoryName/subcategoryName）に変換
  return rawCategories.map(
    (cat: {
      id?: string;
      categoryName?: string;
      name?: string;
      icon?: string;
      subcategories?: Array<{
        id?: string;
        subcategoryName?: string;
        name?: string;
      }>;
    }) => {
      const categoryName = cat.id || cat.categoryName || "";
      return {
        id: categoryName, // URLパス用のidプロパティを追加
        categoryName: categoryName,
        name: cat.name || "",
        icon: cat.icon,
        subcategories: (cat.subcategories || []).map(
          (sub: { id?: string; subcategoryName?: string; name?: string }) => {
            const subcategoryName = sub.id || sub.subcategoryName || "";
            return {
              id: subcategoryName, // URLパス用のidプロパティを追加
              subcategoryName: subcategoryName,
              name: sub.name || "",
              categoryName: categoryName,
            };
          }
        ),
      };
    }
  );
}

/**
 * 全サブカテゴリを取得（レガシー関数）
 *
 * ⚠️ **注意**: この関数は既存コードとの互換性のために残されていますが、
 * 段階的に削除する予定です。新しいコードでは適切なサービス関数を使用してください。
 *
 * @returns {Promise<Subcategory[]>} サブカテゴリの配列
 *
 * @deprecated 新しいコードでは適切なサービス関数を使用してください
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
 * サブカテゴリ名でサブカテゴリを検索（レガシー関数）
 *
 * ⚠️ **注意**: この関数は既存コードとの互換性のために残されていますが、
 * 段階的に削除する予定です。新しいコードでは適切なサービス関数を使用してください。
 *
 * @param {string} subcategoryName - サブカテゴリ名
 * @returns {Subcategory | null} サブカテゴリ。見つからない場合は `null`
 *
 * @deprecated 新しいコードでは適切なサービス関数を使用してください
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
