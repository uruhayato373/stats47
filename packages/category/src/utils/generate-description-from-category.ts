import "server-only";

import type { Category } from "../types";

/**
 * カテゴリからページ説明文を生成
 *
 * @param category - カテゴリ
 * @returns ページ説明文
 */
export function generateDescriptionFromCategory(category: Category): string {
  return `${category.categoryName}に関する統計データを都道府県別に表示。全国および各都道府県の詳細なデータと推移を確認できます。`;
}
