/**
 * カテゴリ関連のデータベースアクセス関数
 *
 * このモジュールは、カテゴリとサブカテゴリのデータベース操作を
 * 提供する純粋関数の集合です。
 *
 * 主な機能:
 * - カテゴリのCRUD操作
 * - サブカテゴリのCRUD操作
 * - 階層構造の管理（カテゴリとサブカテゴリの関連付け）
 * - 表示順序の制御
 *
 * 関数命名規約:
 * - list: 配列全体を返す
 * - find: データベース検索
 * - create: 新規作成
 * - update: 更新
 * - delete: 削除
 */

import { getDataProvider } from "@/infrastructure/database";

import { CATEGORY_QUERIES, SUBCATEGORY_QUERIES } from "./category-queries";

import type {
  Category,
  CategoryDB,
  CreateCategoryInput,
  CreateSubcategoryInput,
  Subcategory,
  SubcategoryDB,
  UpdateCategoryInput,
  UpdateSubcategoryInput,
} from "../types/category.types";

// ============================================================================
// カテゴリ操作関数
// ============================================================================

/**
 * 全カテゴリを取得（表示順序でソート）
 *
 * すべてのカテゴリとそのサブカテゴリを取得します。
 * 表示順序（display_order）でソートされます。
 *
 * @returns カテゴリの配列（各カテゴリにサブカテゴリが含まれる）
 */
export async function listCategories(): Promise<Category[]> {
  const db = await getDataProvider();

  const result = await db.prepare(CATEGORY_QUERIES.listCategories).all();
  const categories = (result.results || []) as unknown as CategoryDB[];

  // 各カテゴリのサブカテゴリも取得
  const categoriesWithSubcategories = await Promise.all(
    categories.map(async (category) => {
      const subcategories = await findSubcategoriesByCategory(
        category.category_key
      );
      return convertCategoryFromDB(category, subcategories);
    })
  );

  return categoriesWithSubcategories;
}

/**
 * カテゴリ名でカテゴリを検索
 *
 * @param categoryName - カテゴリの名前
 * @returns カテゴリ、または存在しない場合はnull
 */
export async function findCategoryByName(
  categoryName: string
): Promise<Category | null> {
  const db = await getDataProvider();

  const result = await db
    .prepare(CATEGORY_QUERIES.findCategoryByName)
    .bind(categoryName)
    .first();

  if (!result) {
    return null;
  }

  const dbCategory = result as unknown as CategoryDB;
  const subcategories = await findSubcategoriesByCategory(categoryName);
  return convertCategoryFromDB(dbCategory, subcategories);
}

/**
 * カテゴリを作成
 *
 * @param data - カテゴリ作成時の入力データ
 * @returns 作成されたカテゴリ
 * @throws Error - カテゴリの作成に失敗した場合
 */
export async function createCategory(
  data: CreateCategoryInput
): Promise<Category> {
  const db = await getDataProvider();

  const result = await db
    .prepare(CATEGORY_QUERIES.createCategory)
    .bind(data.categoryName, data.name, data.icon || null, data.displayOrder)
    .run();

  if (!result.success) {
    throw new Error("Failed to create category");
  }

  const createdCategory = await findCategoryByName(data.categoryName);
  if (!createdCategory) {
    throw new Error("Failed to retrieve created category");
  }
  return createdCategory;
}

/**
 * カテゴリを更新
 *
 * @param categoryName - 更新するカテゴリの名前
 * @param data - カテゴリ更新時の入力データ（部分更新可）
 * @returns 更新されたカテゴリ、またはnull
 * @throws Error - カテゴリの更新に失敗した場合
 */
export async function updateCategory(
  categoryName: string,
  data: UpdateCategoryInput
): Promise<Category | null> {
  const db = await getDataProvider();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.categoryName !== undefined) {
    fields.push("category_name = ?");
    values.push(data.categoryName);
  }
  if (data.icon !== undefined) {
    fields.push("icon = ?");
    values.push(data.icon || null);
  }
  if (data.displayOrder !== undefined) {
    fields.push("display_order = ?");
    values.push(data.displayOrder);
  }

  values.push(categoryName);

  const result = await db
    .prepare(
      `UPDATE categories SET ${fields.join(", ")} WHERE category_key = ?`
    )
    .bind(...values)
    .run();

  if (!result.success) {
    throw new Error("Failed to update category");
  }

  return findCategoryByName(categoryName);
}

/**
 * カテゴリを削除
 *
 * @param categoryName - 削除するカテゴリの名前
 * @returns 削除が成功したかどうか
 */
export async function deleteCategory(categoryName: string): Promise<boolean> {
  const db = await getDataProvider();

  const result = await db
    .prepare(CATEGORY_QUERIES.deleteCategory)
    .bind(categoryName)
    .run();

  return result.success;
}

// ============================================================================
// サブカテゴリ操作関数
// ============================================================================

/**
 * 全サブカテゴリを取得
 *
 * すべてのサブカテゴリを取得します。
 * カテゴリIDと表示順序でソートされます。
 *
 * @returns サブカテゴリの配列
 */
export async function listSubcategories(): Promise<Subcategory[]> {
  const db = await getDataProvider();

  const result = await db.prepare(SUBCATEGORY_QUERIES.listSubcategories).all();

  return ((result.results || []) as unknown as SubcategoryDB[]).map(
    convertSubcategoryFromDB
  );
}

/**
 * カテゴリ名でサブカテゴリを検索
 *
 * 指定されたカテゴリに属するすべてのサブカテゴリを取得します。
 *
 * @param categoryName - カテゴリの名前
 * @returns サブカテゴリの配列
 */
export async function findSubcategoriesByCategory(
  categoryName: string
): Promise<Subcategory[]> {
  const db = await getDataProvider();

  const result = await db
    .prepare(SUBCATEGORY_QUERIES.findSubcategoriesByCategory)
    .bind(categoryName)
    .all();

  return ((result.results || []) as unknown as SubcategoryDB[]).map(
    convertSubcategoryFromDB
  );
}

/**
 * サブカテゴリ名でサブカテゴリを検索
 *
 * @param subcategoryName - サブカテゴリの名前（例: "basic-population"）
 * @returns サブカテゴリ、または存在しない場合はnull
 */
export async function findSubcategoryByName(
  subcategoryName: string
): Promise<Subcategory | null> {
  const db = await getDataProvider();

  const result = await db
    .prepare(SUBCATEGORY_QUERIES.findSubcategoryByName)
    .bind(subcategoryName)
    .first();

  if (!result) {
    return null;
  }

  return convertSubcategoryFromDB(result as unknown as SubcategoryDB);
}

/**
 * サブカテゴリを作成
 *
 * @param data - サブカテゴリ作成時の入力データ
 * @returns 作成されたサブカテゴリ
 * @throws Error - サブカテゴリの作成に失敗した場合
 */
export async function createSubcategory(
  data: CreateSubcategoryInput
): Promise<Subcategory> {
  const db = await getDataProvider();

  const result = await db
    .prepare(SUBCATEGORY_QUERIES.createSubcategory)
    .bind(data.subcategoryName, data.name, data.categoryName, data.displayOrder)
    .run();

  if (!result.success) {
    throw new Error("Failed to create subcategory");
  }

  const createdSubcategory = await findSubcategoryByName(data.subcategoryName);
  if (!createdSubcategory) {
    throw new Error("Failed to retrieve created subcategory");
  }
  return createdSubcategory;
}

/**
 * サブカテゴリを更新
 *
 * @param subcategoryName - 更新するサブカテゴリの名前
 * @param data - サブカテゴリ更新時の入力データ（部分更新可）
 * @returns 更新されたサブカテゴリ、またはnull
 * @throws Error - サブカテゴリの更新に失敗した場合
 */
export async function updateSubcategory(
  subcategoryName: string,
  data: UpdateSubcategoryInput
): Promise<Subcategory | null> {
  const db = await getDataProvider();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.subcategoryName !== undefined) {
    fields.push("subcategory_name = ?");
    values.push(data.subcategoryName);
  }
  if (data.categoryName !== undefined) {
    fields.push("category_key = ?");
    values.push(data.categoryName);
  }
  if (data.displayOrder !== undefined) {
    fields.push("display_order = ?");
    values.push(data.displayOrder);
  }

  values.push(subcategoryName);

  const result = await db
    .prepare(
      `UPDATE subcategories SET ${fields.join(", ")} WHERE subcategory_key = ?`
    )
    .bind(...values)
    .run();

  if (!result.success) {
    throw new Error("Failed to update subcategory");
  }

  return findSubcategoryByName(subcategoryName);
}

/**
 * サブカテゴリを削除
 *
 * @param subcategoryName - 削除するサブカテゴリの名前
 * @returns 削除が成功したかどうか
 */
export async function deleteSubcategory(
  subcategoryName: string
): Promise<boolean> {
  const db = await getDataProvider();

  const result = await db
    .prepare(SUBCATEGORY_QUERIES.deleteSubcategory)
    .bind(subcategoryName)
    .run();

  return result.success;
}

// ============================================================================
// 変換ヘルパー関数（private）
// ============================================================================

/**
 * データベースモデルをドメインモデルに変換
 *
 * スネークケースのデータベースカラム名を
 * キャメルケースのドメインモデルに変換します。
 *
 * @param dbCategory - データベースのカテゴリモデル
 * @param subcategories - サブカテゴリの配列
 * @returns ドメインのカテゴリモデル
 */
function convertCategoryFromDB(
  dbCategory: CategoryDB,
  subcategories: Subcategory[]
): Category {
  return {
    categoryKey: dbCategory.category_key,
    categoryName: dbCategory.category_name,
    id: dbCategory.category_key, // 後方互換性のためのエイリアス
    icon: dbCategory.icon || undefined,
    displayOrder: dbCategory.display_order,
    subcategories,
  };
}

/**
 * データベースモデルをドメインモデルに変換
 *
 * スネークケースのデータベースカラム名を
 * キャメルケースのドメインモデルに変換します。
 *
 * @param dbSubcategory - データベースのサブカテゴリモデル
 * @returns ドメインのサブカテゴリモデル
 */
function convertSubcategoryFromDB(dbSubcategory: SubcategoryDB): Subcategory {
  return {
    subcategoryKey: dbSubcategory.subcategory_key,
    subcategoryName: dbSubcategory.subcategory_name,
    id: dbSubcategory.subcategory_key, // 後方互換性のためのエイリアス
    categoryKey: dbSubcategory.category_key,
    categoryId: dbSubcategory.category_key, // 後方互換性のためのエイリアス
    displayOrder: dbSubcategory.display_order,
  };
}
