/**
 * カテゴリ管理サービス
 *
 * categories.jsonを使用した統計全体の統一的なカテゴリ管理機能を提供
 * 検索、フィルタリング、ソート、ナビゲーション、正規化、バリデーション機能を含む
 */

import categoriesData from "@/config/categories.json";
import { notFound } from "next/navigation";
import type {
  Category,
  CategoryJsonItem,
  SubcategorySearchResult,
  SubcategoryValidationResult,
} from "../types";

// データソース
const categories: CategoryJsonItem[] = categoriesData as CategoryJsonItem[];

/**
 * JSONデータをCategory型に変換するヘルパー関数
 */
function transformCategory(
  category: CategoryJsonItem,
  displayOrder: number
): Category {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    description: "",
    displayOrder,
    subcategories: (category.subcategories || []).map((sub) => ({
      id: sub.id,
      categoryId: category.id,
      name: sub.name,
      href: sub.href,
      displayOrder: sub.displayOrder || 0,
    })),
  };
}

/**
 * 全カテゴリを取得
 */
export function listCategories(): Category[] {
  return categories.map((category, index) =>
    transformCategory(category, index)
  );
}

/**
 * IDでサブカテゴリを検索（カテゴリ情報付き）
 */
export function findSubcategoryById(
  subcategoryId: string
): SubcategorySearchResult | null {
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const subcategory = category.subcategories?.find(
      (sub) => sub.id === subcategoryId
    );

    if (subcategory) {
      return {
        category: transformCategory(category, i),
        subcategory: {
          id: subcategory.id,
          categoryId: category.id,
          name: subcategory.name,
          href: subcategory.href,
          displayOrder: subcategory.displayOrder || 0,
        },
      };
    }
  }

  return null;
}

// ===== サブカテゴリバリデーション機能 =====

/**
 * サブカテゴリの存在確認と整合性チェックを行う
 */
export function validateSubcategory(
  categoryId: string,
  subcategoryId: string
): SubcategoryValidationResult {
  // サブカテゴリの存在確認
  const subcategoryData = findSubcategoryById(subcategoryId);

  if (!subcategoryData) {
    return {
      isValid: false,
      error: `サブカテゴリ '${subcategoryId}' が見つかりません`,
    };
  }

  // カテゴリIDとサブカテゴリIDの整合性チェック
  if (subcategoryData.category.id !== categoryId) {
    return {
      isValid: false,
      error: `サブカテゴリ '${subcategoryId}' はカテゴリ '${categoryId}' に属していません`,
    };
  }

  return {
    isValid: true,
    subcategoryData,
  };
}

/**
 * サブカテゴリのバリデーションを行い、無効な場合は404エラーを発生させる
 */
export function validateSubcategoryOrThrow(
  categoryId: string,
  subcategoryId: string
) {
  const result = validateSubcategory(categoryId, subcategoryId);

  if (!result.isValid) {
    console.warn(`サブカテゴリバリデーションエラー: ${result.error}`);
    notFound();
  }

  return result.subcategoryData!;
}
