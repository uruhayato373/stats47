import "server-only";

import type { Category } from "../types";
import { generateBreadcrumbsFromCategories, type CategoryBreadcrumb } from "./generate-breadcrumbs-from-categories";
import { generateDescriptionFromCategory } from "./generate-description-from-category";
import { generateTitleFromCategory } from "./generate-title-from-category";
import { getCategoryData } from "./get-category-data";

export interface CategoryMetadata {
  category: Category;
  breadcrumbs: CategoryBreadcrumb[];
  title: string;
  description: string;
}

/**
 * カテゴリキーからメタデータを取得
 *
 * @param key - カテゴリキー
 * @returns カテゴリメタデータ
 */
export async function getCategoryMetadata(key: string): Promise<CategoryMetadata | null> {
  const categoryData = await getCategoryData(key);

  if (!categoryData) {
    return null;
  }

  return {
    category: categoryData,
    breadcrumbs: generateBreadcrumbsFromCategories([categoryData]),
    title: generateTitleFromCategory(categoryData),
    description: generateDescriptionFromCategory(categoryData),
  };
}
