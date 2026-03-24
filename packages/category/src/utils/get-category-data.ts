import "server-only";

import { unwrap } from "@stats47/types";

import { findCategoryByKey } from "../repositories";
import type { Category } from "../types";

/**
 * カテゴリデータを取得
 *
 * @param key - カテゴリキー
 * @returns カテゴリデータ
 */
export async function getCategoryData(
  key: string
): Promise<Category | undefined> {
  const category = unwrap(await findCategoryByKey(key));
  return category ?? undefined;
}
