import "server-only";

import type { Category } from "../types";

/**
 * 指定カテゴリの親カテゴリを取得
 * カテゴリは現在フラット構造のため、常に空配列を返す
 *
 * @param _key - カテゴリキー
 * @returns 親カテゴリの配列（常に空）
 */
export async function getParentCategories(_key: string): Promise<Category[]> {
  return [];
}
