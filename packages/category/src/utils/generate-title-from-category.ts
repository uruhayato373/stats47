import "server-only";

import { SITE } from "@stats47/types";

import type { Category } from "../types";

/**
 * カテゴリからページタイトルを生成
 *
 * @param category - カテゴリ
 * @returns ページタイトル
 */
export function generateTitleFromCategory(category: Category): string {
  return `${category.categoryName} | ${SITE.name}`;
}
