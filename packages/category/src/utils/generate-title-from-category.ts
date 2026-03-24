import "server-only";

import type { Category } from "../types";

/**
 * カテゴリからページタイトルを生成
 *
 * @param category - カテゴリ
 * @returns ページタイトル
 */
export function generateTitleFromCategory(category: Category): string {
  return `${category.categoryName} | 統計で見る都道府県`;
}
