import "server-only";

import type { Category } from "../types";

export interface CategoryBreadcrumb {
  name: string;
  href: string;
}

/**
 * カテゴリからパンくずリストを生成
 *
 * @param items - カテゴリの配列
 * @returns パンくずリスト
 */
export function generateBreadcrumbsFromCategories(
  items: Category[]
): CategoryBreadcrumb[] {
  const breadcrumbs: CategoryBreadcrumb[] = [];
  const pathSegments: string[] = [];

  for (const item of items) {
    pathSegments.push(item.categoryKey);
    breadcrumbs.push({
      name: item.categoryName,
      href: `/${pathSegments.join("/")}`,
    });
  }

  return breadcrumbs;
}
