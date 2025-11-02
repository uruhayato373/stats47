/**
 * Category Service
 *
 * カテゴリ・サブカテゴリに関するビジネスロジックを担当するサービス層。
 * カテゴリとサブカテゴリのCRUD操作、バリデーションなどの機能を提供する。
 *
 * ## 主な機能
 * - カテゴリ・サブカテゴリの取得
 * - カテゴリ・サブカテゴリの作成・更新・削除
 * - 入力データのバリデーション
 *
 * @module CategoryService
 */

import "server-only";
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategories,
  updateCategory,
  updateSubcategory,
} from "../repositories/category-repository";

import type { Category, Subcategory } from "../types/category.types";

/**
 * 全てのカテゴリとサブカテゴリを取得
 *
 * すべてのカテゴリとそのサブカテゴリを一覧で取得する。
 * リポジトリ層から取得したデータをそのまま返す。
 *
 * @returns {Promise<Category[]>} カテゴリとサブカテゴリの配列
 * @throws {Error} リポジトリ層でのデータ取得に失敗した場合
 *
 * @example
 * ```ts
 * const categories = await listCategoriesWithSubcategories();
 * console.log(`取得したカテゴリ数: ${categories.length}`);
 * ```
 */
export async function listCategoriesWithSubcategories(): Promise<Category[]> {
  return await listCategories();
}

/**
 * カテゴリを更新
 *
 * 指定されたカテゴリの情報を部分更新する。
 * 指定されたフィールドのみが更新され、未指定のフィールドは変更されない。
 *
 * @param {string} categoryKey - カテゴリキー
 * @param {Object} data - 更新データ
 * @param {string} [data.categoryKey] - 新しいカテゴリキー
 * @param {string} [data.categoryName] - カテゴリ名
 * @param {string | null} [data.icon] - アイコン
 * @param {number} [data.displayOrder] - 表示順序
 * @returns {Promise<Category | null>} 更新されたカテゴリ。失敗時は `null`
 * @throws {Error} `categoryKey` が空文字列の場合
 * @throws {Error} リポジトリ層でのデータ更新に失敗した場合
 *
 * @example
 * ```ts
 * const updated = await updateCategoryService("population", {
 *   categoryName: "人口統計",
 *   displayOrder: 1
 * });
 * ```
 */
export async function updateCategoryService(
  categoryKey: string,
  data: {
    categoryKey?: string;
    categoryName?: string;
    icon?: string | null;
    displayOrder?: number;
  }
): Promise<Category | null> {
  if (!categoryKey) throw new Error("categoryKey is required");
  return await updateCategory(categoryKey, data);
}

/**
 * カテゴリを削除
 *
 * 指定されたカテゴリを削除する。
 * 削除成功時のみ `true` を返す。
 *
 * @param {string} categoryKey - カテゴリキー
 * @returns {Promise<boolean>} 削除成功時 `true`、失敗時 `false`
 * @throws {Error} `categoryKey` が空文字列の場合
 *
 * @example
 * ```ts
 * const success = await deleteCategoryService("population");
 * if (success) {
 *   console.log("カテゴリを削除しました");
 * }
 * ```
 */
export async function deleteCategoryService(
  categoryKey: string
): Promise<boolean> {
  if (!categoryKey) throw new Error("categoryKey is required");
  return await deleteCategory(categoryKey);
}

/**
 * サブカテゴリを更新
 *
 * 指定されたサブカテゴリの情報を部分更新する。
 * 指定されたフィールドのみが更新され、未指定のフィールドは変更されない。
 *
 * @param {string} subcategoryKey - サブカテゴリキー
 * @param {Object} data - 更新データ
 * @param {string} [data.subcategoryKey] - 新しいサブカテゴリキー
 * @param {string} [data.subcategoryName] - サブカテゴリ名
 * @param {string} [data.categoryKey] - 所属カテゴリキー
 * @param {number} [data.displayOrder] - 表示順序
 * @returns {Promise<Subcategory | null>} 更新されたサブカテゴリ。失敗時は `null`
 * @throws {Error} `subcategoryKey` が空文字列の場合
 * @throws {Error} リポジトリ層でのデータ更新に失敗した場合
 *
 * @example
 * ```ts
 * const updated = await updateSubcategoryService("basic-population", {
 *   subcategoryName: "基本人口統計",
 *   displayOrder: 1
 * });
 * ```
 */
export async function updateSubcategoryService(
  subcategoryKey: string,
  data: {
    subcategoryKey?: string;
    subcategoryName?: string;
    categoryKey?: string;
    displayOrder?: number;
  }
): Promise<Subcategory | null> {
  if (!subcategoryKey) throw new Error("subcategoryKey is required");
  return await updateSubcategory(subcategoryKey, data);
}

/**
 * サブカテゴリを削除
 *
 * 指定されたサブカテゴリを削除する。
 * 削除成功時のみ `true` を返す。
 *
 * @param {string} subcategoryKey - サブカテゴリキー
 * @returns {Promise<boolean>} 削除成功時 `true`、失敗時 `false`
 * @throws {Error} `subcategoryKey` が空文字列の場合
 *
 * @example
 * ```ts
 * const success = await deleteSubcategoryService("basic-population");
 * if (success) {
 *   console.log("サブカテゴリを削除しました");
 * }
 * ```
 */
export async function deleteSubcategoryService(
  subcategoryKey: string
): Promise<boolean> {
  if (!subcategoryKey) throw new Error("subcategoryKey is required");
  return await deleteSubcategory(subcategoryKey);
}

/**
 * カテゴリを作成
 *
 * 新しいカテゴリを作成する。
 * 必須フィールド（`categoryKey`, `name`）のバリデーションを実行する。
 *
 * @param {Object} data - カテゴリ作成データ
 * @param {string} data.categoryKey - カテゴリキー（必須）
 * @param {string} data.name - カテゴリ名（必須）
 * @param {string | null} [data.icon] - アイコン
 * @param {number} [data.displayOrder] - 表示順序
 * @returns {Promise<Category>} 作成されたカテゴリ
 * @throws {Error} `categoryKey` または `name` が未指定の場合
 * @throws {Error} リポジトリ層でのデータ作成に失敗した場合
 *
 * @example
 * ```ts
 * const category = await createCategoryService({
 *   categoryKey: "population",
 *   name: "人口統計",
 *   icon: "users",
 *   displayOrder: 1
 * });
 * console.log(`作成されたカテゴリ: ${category.categoryName}`);
 * ```
 */
export async function createCategoryService(data: {
  categoryKey: string;
  name: string;
  icon?: string | null;
  displayOrder?: number;
}): Promise<Category> {
  if (!data.categoryKey || !data.name) {
    throw new Error("categoryKey and name are required");
  }
  return await createCategory(data);
}

/**
 * サブカテゴリを作成
 *
 * 新しいサブカテゴリを作成する。
 * 必須フィールド（`subcategoryKey`, `name`, `categoryKey`）のバリデーションを実行する。
 *
 * @param {Object} data - サブカテゴリ作成データ
 * @param {string} data.subcategoryKey - サブカテゴリキー（必須）
 * @param {string} data.name - サブカテゴリ名（必須）
 * @param {string} data.categoryKey - 所属カテゴリキー（必須）
 * @param {number} [data.displayOrder] - 表示順序
 * @returns {Promise<Subcategory>} 作成されたサブカテゴリ
 * @throws {Error} `subcategoryKey`, `name`, `categoryKey` のいずれかが未指定の場合
 * @throws {Error} リポジトリ層でのデータ作成に失敗した場合
 *
 * @example
 * ```ts
 * const subcategory = await createSubcategoryService({
 *   subcategoryKey: "basic-population",
 *   name: "基本人口統計",
 *   categoryKey: "population",
 *   displayOrder: 1
 * });
 * console.log(`作成されたサブカテゴリ: ${subcategory.subcategoryName}`);
 * ```
 */
export async function createSubcategoryService(data: {
  subcategoryKey: string;
  name: string;
  categoryKey: string;
  displayOrder?: number;
}): Promise<Subcategory> {
  if (!data.subcategoryKey || !data.name || !data.categoryKey) {
    throw new Error("subcategoryKey, name and categoryKey are required");
  }
  return await createSubcategory(data);
}
