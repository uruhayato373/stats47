/**
 * ナビゲーション用のカテゴリ管理関数
 */

import { CategoryService } from "./category-service";
import type { Category } from "./types";

/**
 * ナビゲーション表示用のカテゴリ一覧を取得
 * displayOrder順にソートされた状態で返す
 */
export function getNavigationCategories(): Category[] {
  return CategoryService.getAllCategories({
    field: "displayOrder",
    order: "asc",
  });
}

/**
 * サイドバーのカテゴリセクション用データを取得
 * ナビゲーションアイテムとして使用しやすい形式に変換
 */
export interface SidebarCategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  href: string;
  subcategories?: Array<{
    id: string;
    name: string;
    href: string;
  }>;
}

export function getCategoriesForSidebar(): SidebarCategoryItem[] {
  const categories = getNavigationCategories();

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    href: `/${category.id}`,
    subcategories: category.subcategories?.map((sub) => ({
      id: sub.id,
      name: sub.name,
      href: sub.href,
    })),
  }));
}
