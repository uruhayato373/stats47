/**
 * Category Actions (Server Actions)
 *
 * カテゴリ・サブカテゴリ管理に関するServer Actions。
 * データの取得・更新・削除を行う関数を提供する。
 *
 * ## キャッシュ戦略
 * - **取得**: `listCategoriesAction()` はデータベースから直接取得（リポジトリ層でキャッシュタグを設定する場合は`fetch`キャッシュまたは`unstable_cache`を使用）
 * - **更新・削除**: 操作後に `revalidateTag("categories")` でキャッシュを無効化
 *
 * ## 注意事項
 * ⚠️ **Edge Runtimeでの制約**: Edge Runtimeでは`"use cache"`ディレクティブは使用できません。
 * キャッシュが必要な場合は、リポジトリ層で`fetch`キャッシュ（`cache: "force-cache"` + `next.tags`）または`unstable_cache`を使用してください。
 * ⚠️ **キャッシュタグの問題**: 現在、リポジトリ層でキャッシュタグが設定されていないため、
 * `revalidateTag("categories")` が正しく機能しない可能性があります。
 * 修正が必要な場合は、リポジトリ層で `unstable_cache` を使用してキャッシュタグを設定してください。
 *
 * @module CategoryActions
 */

"use server";

import { revalidateTag } from "next/cache";

import {
  deleteCategoryService,
  deleteSubcategoryService,
  listCategoriesWithSubcategories,
  updateCategoryService,
  updateSubcategoryService,
} from "../services/category-service";

import type { Category, Subcategory } from "../types/category.types";

/**
 * カテゴリ一覧を取得
 *
 * すべてのカテゴリとそのサブカテゴリを取得する。
 *
 * @returns {Promise<Category[]>} カテゴリとサブカテゴリの配列
 *
 * @example
 * ```ts
 * const categories = await listCategoriesAction();
 * console.log(`取得したカテゴリ数: ${categories.length}`);
 * ```
 */
export async function listCategoriesAction(): Promise<Category[]> {
  return await listCategoriesWithSubcategories();
}

/**
 * カテゴリを更新
 *
 * 指定されたカテゴリの情報を更新する。
 * 更新後、`revalidateTag("categories")` でキャッシュを無効化する。
 *
 * ⚠️ **注意**: リポジトリ層でキャッシュタグが設定されていない場合、
 * `revalidateTag` は機能しません。
 *
 * @param {string} categoryKey - カテゴリキー
 * @param {Object} data - 更新データ
 * @param {string} [data.categoryKey] - 新しいカテゴリキー
 * @param {string} [data.categoryName] - カテゴリ名
 * @param {string | null} [data.icon] - アイコン
 * @param {number} [data.displayOrder] - 表示順序
 * @returns {Promise<Category | null>} 更新されたカテゴリ。失敗時は `null`
 *
 * @example
 * ```ts
 * const updated = await updateCategoryAction("population", {
 *   categoryName: "人口統計",
 *   displayOrder: 1
 * });
 * ```
 */
export async function updateCategoryAction(
  categoryKey: string,
  data: {
    categoryKey?: string;
    categoryName?: string;
    icon?: string | null;
    displayOrder?: number;
  }
): Promise<Category | null> {
  const updated = await updateCategoryService(categoryKey, data);
  revalidateTag("categories");
  return updated;
}

/**
 * カテゴリを削除
 *
 * 指定されたカテゴリを削除する。
 * 削除成功時のみ、`revalidateTag("categories")` でキャッシュを無効化する。
 *
 * @param {string} categoryKey - カテゴリキー
 * @returns {Promise<boolean>} 削除成功時 `true`、失敗時 `false`
 *
 * @example
 * ```ts
 * const success = await deleteCategoryAction("population");
 * if (success) {
 *   console.log("カテゴリを削除しました");
 * }
 * ```
 */
export async function deleteCategoryAction(
  categoryKey: string
): Promise<boolean> {
  const ok = await deleteCategoryService(categoryKey);
  if (ok) revalidateTag("categories");
  return ok;
}

/**
 * サブカテゴリを更新
 *
 * 指定されたサブカテゴリの情報を更新する。
 * 更新後、`revalidateTag("categories")` でキャッシュを無効化する。
 *
 * @param {string} subcategoryKey - サブカテゴリキー
 * @param {Object} data - 更新データ
 * @param {string} [data.subcategoryKey] - 新しいサブカテゴリキー
 * @param {string} [data.subcategoryName] - サブカテゴリ名
 * @param {string} [data.categoryKey] - 所属カテゴリキー
 * @param {number} [data.displayOrder] - 表示順序
 * @returns {Promise<Subcategory | null>} 更新されたサブカテゴリ。失敗時は `null`
 *
 * @example
 * ```ts
 * const updated = await updateSubcategoryAction("basic-population", {
 *   subcategoryName: "基本人口統計",
 *   displayOrder: 1
 * });
 * ```
 */
export async function updateSubcategoryAction(
  subcategoryKey: string,
  data: {
    subcategoryKey?: string;
    subcategoryName?: string;
    categoryKey?: string;
    displayOrder?: number;
  }
): Promise<Subcategory | null> {
  const updated = await updateSubcategoryService(subcategoryKey, data);
  revalidateTag("categories");
  return updated;
}

/**
 * サブカテゴリを削除
 *
 * 指定されたサブカテゴリを削除する。
 * 削除成功時のみ、`revalidateTag("categories")` でキャッシュを無効化する。
 *
 * @param {string} subcategoryKey - サブカテゴリキー
 * @returns {Promise<boolean>} 削除成功時 `true`、失敗時 `false`
 *
 * @example
 * ```ts
 * const success = await deleteSubcategoryAction("basic-population");
 * if (success) {
 *   console.log("サブカテゴリを削除しました");
 * }
 * ```
 */
export async function deleteSubcategoryAction(
  subcategoryKey: string
): Promise<boolean> {
  const ok = await deleteSubcategoryService(subcategoryKey);
  if (ok) revalidateTag("categories");
  return ok;
}

/**
 * カテゴリのキャッシュを無効化
 *
 * カテゴリデータのキャッシュを明示的に無効化する。
 * 手動でキャッシュをクリアしたい場合に使用する。
 *
 * ⚠️ **注意**: リポジトリ層でキャッシュタグが設定されていない場合、
 * この関数は機能しません。
 *
 * @returns {Promise<void>}
 *
 * @example
 * ```ts
 * // カテゴリデータを更新した後、キャッシュを無効化
 * await updateCategoryAction("population", { categoryName: "人口統計" });
 * await revalidateCategoriesAction();
 * ```
 */
export async function revalidateCategoriesAction(): Promise<void> {
  revalidateTag("categories");
}
