/**
 * サブカテゴリバリデーション関数
 *
 * サブカテゴリの存在確認と整合性チェックを提供
 */

import { CategoryService } from "./category-service";
import { notFound } from "next/navigation";

export interface SubcategoryValidationResult {
  isValid: boolean;
  subcategoryData?: {
    category: {
      id: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      displayOrder?: number;
      subcategories?: Array<{
        id: string;
        name: string;
        href: string;
      }>;
    };
    subcategory: {
      id: string;
      name: string;
      href: string;
    };
  };
  error?: string;
}

/**
 * サブカテゴリの存在確認と整合性チェックを行う
 *
 * @param categoryId カテゴリID
 * @param subcategoryId サブカテゴリID
 * @returns バリデーション結果
 */
export function validateSubcategory(
  categoryId: string,
  subcategoryId: string
): SubcategoryValidationResult {
  // サブカテゴリの存在確認
  const subcategoryData = CategoryService.getSubcategoryById(subcategoryId);

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
 *
 * @param categoryId カテゴリID
 * @param subcategoryId サブカテゴリID
 * @returns 有効な場合のサブカテゴリデータ
 * @throws {notFound} バリデーションに失敗した場合
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
