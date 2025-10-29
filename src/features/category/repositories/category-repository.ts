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
      const subcategories = await findSubcategoriesByCategory(category.id);
      return convertCategoryFromDB(category, subcategories);
    })
  );

  return categoriesWithSubcategories;
}

/**
 * カテゴリIDでカテゴリを検索
 *
 * @param id - カテゴリのID
 * @returns カテゴリ、または存在しない場合はnull
 */
export async function findCategoryById(id: number): Promise<Category | null> {
  const db = await getDataProvider();

  const result = await db
    .prepare(CATEGORY_QUERIES.findCategoryById)
    .bind(id)
    .first();

  if (!result) {
    return null;
  }

  const dbCategory = result as unknown as CategoryDB;
  const subcategories = await findSubcategoriesByCategory(id);
  return convertCategoryFromDB(dbCategory, subcategories);
}

/**
 * カテゴリキーでカテゴリを検索
 *
 * @param categoryKey - カテゴリのキー（例: "population"）
 * @returns カテゴリ、または存在しない場合はnull
 */
export async function findCategoryByKey(
  categoryKey: string
): Promise<Category | null> {
  const db = await getDataProvider();

  const result = await db
    .prepare(CATEGORY_QUERIES.findCategoryByKey)
    .bind(categoryKey)
    .first();

  if (!result) {
    return null;
  }

  const dbCategory = result as unknown as CategoryDB;
  const subcategories = await findSubcategoriesByCategory(dbCategory.id);
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
    .bind(data.categoryKey, data.name, data.icon || null, data.displayOrder)
    .run();

  if (!result.success) {
    throw new Error("Failed to create category");
  }

  const lastRowId = (result.meta as any).last_row_id as number;
  const createdCategory = await findCategoryById(lastRowId);
  if (!createdCategory) {
    throw new Error("Failed to retrieve created category");
  }
  return createdCategory;
}

/**
 * カテゴリを更新
 *
 * @param id - 更新するカテゴリのID
 * @param data - カテゴリ更新時の入力データ（部分更新可）
 * @returns 更新されたカテゴリ、またはnull
 * @throws Error - カテゴリの更新に失敗した場合
 */
export async function updateCategory(
  id: number,
  data: UpdateCategoryInput
): Promise<Category | null> {
  const db = await getDataProvider();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.categoryKey !== undefined) {
    fields.push("category_key = ?");
    values.push(data.categoryKey);
  }
  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.icon !== undefined) {
    fields.push("icon = ?");
    values.push(data.icon || null);
  }
  if (data.displayOrder !== undefined) {
    fields.push("display_order = ?");
    values.push(data.displayOrder);
  }
  if (data.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(data.isActive ? 1 : 0);
  }

  values.push(id);

  const result = await db
    .prepare(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  if (!result.success) {
    throw new Error("Failed to update category");
  }

  return findCategoryById(id);
}

/**
 * カテゴリを削除
 *
 * @param id - 削除するカテゴリのID
 * @returns 削除が成功したかどうか
 */
export async function deleteCategory(id: number): Promise<boolean> {
  const db = await getDataProvider();

  const result = await db
    .prepare(CATEGORY_QUERIES.deleteCategory)
    .bind(id)
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
 * カテゴリIDでサブカテゴリを検索
 *
 * 指定されたカテゴリに属するすべてのサブカテゴリを取得します。
 *
 * @param categoryId - カテゴリのID
 * @returns サブカテゴリの配列
 */
export async function findSubcategoriesByCategory(
  categoryId: number
): Promise<Subcategory[]> {
  const db = await getDataProvider();

  const result = await db
    .prepare(SUBCATEGORY_QUERIES.findSubcategoriesByCategory)
    .bind(categoryId)
    .all();

  return ((result.results || []) as unknown as SubcategoryDB[]).map(
    convertSubcategoryFromDB
  );
}

/**
 * サブカテゴリIDでサブカテゴリを検索
 *
 * @param id - サブカテゴリのID
 * @returns サブカテゴリ、または存在しない場合はnull
 */
export async function findSubcategoryById(
  id: number
): Promise<Subcategory | null> {
  const db = await getDataProvider();

  const result = await db
    .prepare(SUBCATEGORY_QUERIES.findSubcategoryById)
    .bind(id)
    .first();

  if (!result) {
    return null;
  }

  return convertSubcategoryFromDB(result as unknown as SubcategoryDB);
}

/**
 * サブカテゴリキーでサブカテゴリを検索
 *
 * @param subcategoryKey - サブカテゴリのキー（例: "basic-population"）
 * @returns サブカテゴリ、または存在しない場合はnull
 */
export async function findSubcategoryByKey(
  subcategoryKey: string
): Promise<Subcategory | null> {
  const db = await getDataProvider();

  const result = await db
    .prepare(SUBCATEGORY_QUERIES.findSubcategoryByKey)
    .bind(subcategoryKey)
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
    .bind(
      data.subcategoryKey,
      data.name,
      data.categoryId,
      data.href || null,
      data.displayOrder
    )
    .run();

  if (!result.success) {
    throw new Error("Failed to create subcategory");
  }

  const lastRowId = (result.meta as any).last_row_id as number;
  const createdSubcategory = await findSubcategoryById(lastRowId);
  if (!createdSubcategory) {
    throw new Error("Failed to retrieve created subcategory");
  }
  return createdSubcategory;
}

/**
 * サブカテゴリを更新
 *
 * @param id - 更新するサブカテゴリのID
 * @param data - サブカテゴリ更新時の入力データ（部分更新可）
 * @returns 更新されたサブカテゴリ、またはnull
 * @throws Error - サブカテゴリの更新に失敗した場合
 */
export async function updateSubcategory(
  id: number,
  data: UpdateSubcategoryInput
): Promise<Subcategory | null> {
  const db = await getDataProvider();

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.subcategoryKey !== undefined) {
    fields.push("subcategory_key = ?");
    values.push(data.subcategoryKey);
  }
  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.categoryId !== undefined) {
    fields.push("category_id = ?");
    values.push(data.categoryId);
  }
  if (data.href !== undefined) {
    fields.push("href = ?");
    values.push(data.href || null);
  }
  if (data.displayOrder !== undefined) {
    fields.push("display_order = ?");
    values.push(data.displayOrder);
  }
  if (data.isActive !== undefined) {
    fields.push("is_active = ?");
    values.push(data.isActive ? 1 : 0);
  }

  values.push(id);

  const result = await db
    .prepare(`UPDATE subcategories SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  if (!result.success) {
    throw new Error("Failed to update subcategory");
  }

  return findSubcategoryById(id);
}

/**
 * サブカテゴリを削除
 *
 * @param id - 削除するサブカテゴリのID
 * @returns 削除が成功したかどうか
 */
export async function deleteSubcategory(id: number): Promise<boolean> {
  const db = await getDataProvider();

  const result = await db
    .prepare(SUBCATEGORY_QUERIES.deleteSubcategory)
    .bind(id)
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
    id: dbCategory.id,
    categoryKey: dbCategory.category_key,
    name: dbCategory.name,
    icon: dbCategory.icon || undefined,
    displayOrder: dbCategory.display_order,
    isActive: dbCategory.is_active,
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
    id: dbSubcategory.id,
    subcategoryKey: dbSubcategory.subcategory_key,
    name: dbSubcategory.name,
    categoryId: dbSubcategory.category_id,
    href: dbSubcategory.href || undefined,
    displayOrder: dbSubcategory.display_order,
    isActive: dbSubcategory.is_active,
  };
}
