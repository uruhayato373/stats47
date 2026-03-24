import "server-only";

import type { Category as CategoryRow } from "@stats47/database/schema";

import type { Category } from "../types/category";

/**
 * データベースモデルをドメインモデルに変換
 */
export function convertCategoryFromDB(dbCategory: CategoryRow): Category {
  return {
    categoryKey: dbCategory.categoryKey,
    categoryName: dbCategory.categoryName,
    icon: dbCategory.icon || undefined,
    displayOrder: dbCategory.displayOrder ?? 0,
  };
}
