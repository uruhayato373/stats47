/**
 * カテゴリデータ正規化ユーティリティ
 *
 * カテゴリデータの変換・正規化処理を一元管理
 */

import type { Category, Subcategory } from "./types";

export interface NormalizedCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  displayOrder: number;
  subcategories: Subcategory[];
}

/**
 * カテゴリデータを正規化する
 * 必須フィールドにデフォルト値を設定し、型安全性を確保する
 *
 * @param category 元のカテゴリデータ
 * @returns 正規化されたカテゴリデータ
 */
export function normalizeCategoryData(category: Category): NormalizedCategory {
  return {
    id: category.id,
    name: category.name,
    description: category.description || "",
    icon: category.icon || "",
    color: category.color || "gray",
    displayOrder: category.displayOrder || 0,
    subcategories: category.subcategories || [],
  };
}

/**
 * 複数のカテゴリデータを一括で正規化する
 *
 * @param categories 元のカテゴリデータ配列
 * @returns 正規化されたカテゴリデータ配列
 */
export function normalizeCategoriesData(
  categories: Category[]
): NormalizedCategory[] {
  return categories.map(normalizeCategoryData);
}

/**
 * カテゴリデータの検証を行う
 * 必須フィールドが存在するかチェック
 *
 * @param category 検証対象のカテゴリデータ
 * @returns 検証結果
 */
export function validateCategoryData(category: Category): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!category.id) {
    errors.push("カテゴリIDが設定されていません");
  }

  if (!category.name) {
    errors.push("カテゴリ名が設定されていません");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
