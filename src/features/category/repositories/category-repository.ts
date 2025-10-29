/**
 * カテゴリ関連のデータベースアクセス層
 */

import { getDataProvider } from "@/infrastructure/database";

export interface CategoryDB {
  id: number;
  category_key: string;
  name: string;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubcategoryDB {
  id: number;
  subcategory_key: string;
  name: string;
  category_id: number;
  href: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  categoryKey: string;
  name: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  subcategoryKey: string;
  name: string;
  categoryId: number;
  href?: string;
  displayOrder: number;
  isActive: boolean;
}

export class CategoryRepository {
  private db: any; // D1Database互換型

  constructor(db: any) {
    this.db = db;
  }

  /**
   * 環境に応じた適切なリポジトリインスタンスを作成
   */
  static async create(): Promise<CategoryRepository> {
    const db = await getDataProvider();
    return new CategoryRepository(db);
  }

  /**
   * 全カテゴリを取得（表示順序でソート）
   */
  async getAllCategories(): Promise<Category[]> {
    const result = await this.db
      .prepare("SELECT * FROM categories ORDER BY display_order")
      .all();

    const categories = (result.results || []) as unknown as CategoryDB[];

    // 各カテゴリのサブカテゴリも取得
    const categoriesWithSubcategories = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await this.getSubcategoriesByCategory(
          category.id
        );
        return this.convertCategoryFromDB(category, subcategories);
      })
    );

    return categoriesWithSubcategories;
  }

  /**
   * カテゴリIDでカテゴリを取得
   */
  async getCategoryById(id: number): Promise<Category | null> {
    const result = await this.db
      .prepare("SELECT * FROM categories WHERE id = ?")
      .bind(id)
      .first();

    if (!result) {
      return null;
    }

    const dbCategory = result as unknown as CategoryDB;
    const subcategories = await this.getSubcategoriesByCategory(id);
    return this.convertCategoryFromDB(dbCategory, subcategories);
  }

  /**
   * カテゴリキーでカテゴリを取得
   */
  async getCategoryByKey(categoryKey: string): Promise<Category | null> {
    const result = await this.db
      .prepare("SELECT * FROM categories WHERE category_key = ?")
      .bind(categoryKey)
      .first();

    if (!result) {
      return null;
    }

    const dbCategory = result as unknown as CategoryDB;
    const subcategories = await this.getSubcategoriesByCategory(dbCategory.id);
    return this.convertCategoryFromDB(dbCategory, subcategories);
  }

  /**
   * 全サブカテゴリを取得
   */
  async getAllSubcategories(): Promise<Subcategory[]> {
    const result = await this.db
      .prepare(
        "SELECT * FROM subcategories ORDER BY category_id, display_order"
      )
      .all();

    return ((result.results || []) as unknown as SubcategoryDB[]).map(
      this.convertSubcategoryFromDB
    );
  }

  /**
   * カテゴリIDでサブカテゴリを取得
   */
  async getSubcategoriesByCategory(categoryId: number): Promise<Subcategory[]> {
    const result = await this.db
      .prepare(
        "SELECT * FROM subcategories WHERE category_id = ? ORDER BY display_order"
      )
      .bind(categoryId)
      .all();

    return ((result.results || []) as unknown as SubcategoryDB[]).map(
      this.convertSubcategoryFromDB
    );
  }

  /**
   * サブカテゴリIDでサブカテゴリを取得
   */
  async getSubcategoryById(id: number): Promise<Subcategory | null> {
    const result = await this.db
      .prepare("SELECT * FROM subcategories WHERE id = ?")
      .bind(id)
      .first();

    if (!result) {
      return null;
    }

    return this.convertSubcategoryFromDB(result as unknown as SubcategoryDB);
  }

  /**
   * サブカテゴリキーでサブカテゴリを取得
   */
  async getSubcategoryByKey(
    subcategoryKey: string
  ): Promise<Subcategory | null> {
    const result = await this.db
      .prepare("SELECT * FROM subcategories WHERE subcategory_key = ?")
      .bind(subcategoryKey)
      .first();

    if (!result) {
      return null;
    }

    return this.convertSubcategoryFromDB(result as unknown as SubcategoryDB);
  }

  /**
   * カテゴリを作成
   */
  async createCategory(data: {
    categoryKey: string;
    name: string;
    icon?: string;
    color?: string;
    displayOrder: number;
  }): Promise<Category> {
    const result = await this.db
      .prepare(
        `INSERT INTO categories (category_key, name, icon, color, display_order)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        data.categoryKey,
        data.name,
        data.icon || null,
        data.color || null,
        data.displayOrder
      )
      .run();

    if (!result.success) {
      throw new Error("Failed to create category");
    }

    const createdCategory = await this.getCategoryById(result.meta.last_row_id);
    if (!createdCategory) {
      throw new Error("Failed to retrieve created category");
    }
    return createdCategory;
  }

  /**
   * カテゴリを更新
   */
  async updateCategory(
    id: number,
    data: {
      categoryKey?: string;
      name?: string;
      icon?: string;
      color?: string;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<Category | null> {
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
    if (data.color !== undefined) {
      fields.push("color = ?");
      values.push(data.color || null);
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

    const result = await this.db
      .prepare(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    if (!result.success) {
      throw new Error("Failed to update category");
    }

    return this.getCategoryById(id);
  }

  /**
   * カテゴリを削除
   */
  async deleteCategory(id: number): Promise<boolean> {
    const result = await this.db
      .prepare("DELETE FROM categories WHERE id = ?")
      .bind(id)
      .run();

    return result.success;
  }

  /**
   * サブカテゴリを作成
   */
  async createSubcategory(data: {
    subcategoryKey: string;
    name: string;
    categoryId: number;
    href?: string;
    displayOrder: number;
  }): Promise<Subcategory> {
    const result = await this.db
      .prepare(
        `INSERT INTO subcategories (subcategory_key, name, category_id, href, display_order)
         VALUES (?, ?, ?, ?, ?)`
      )
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

    const createdSubcategory = await this.getSubcategoryById(
      result.meta.last_row_id
    );
    if (!createdSubcategory) {
      throw new Error("Failed to retrieve created subcategory");
    }
    return createdSubcategory;
  }

  /**
   * サブカテゴリを更新
   */
  async updateSubcategory(
    id: number,
    data: {
      subcategoryKey?: string;
      name?: string;
      categoryId?: number;
      href?: string;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<Subcategory | null> {
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

    const result = await this.db
      .prepare(`UPDATE subcategories SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    if (!result.success) {
      throw new Error("Failed to update subcategory");
    }

    return this.getSubcategoryById(id);
  }

  /**
   * サブカテゴリを削除
   */
  async deleteSubcategory(id: number): Promise<boolean> {
    const result = await this.db
      .prepare("DELETE FROM subcategories WHERE id = ?")
      .bind(id)
      .run();

    return result.success;
  }

  /**
   * データベースモデルをドメインモデルに変換
   */
  private convertCategoryFromDB(
    dbCategory: CategoryDB,
    subcategories: Subcategory[]
  ): Category {
    return {
      id: dbCategory.id,
      categoryKey: dbCategory.category_key,
      name: dbCategory.name,
      icon: dbCategory.icon || undefined,
      color: dbCategory.color || undefined,
      displayOrder: dbCategory.display_order,
      isActive: dbCategory.is_active,
      subcategories,
    };
  }

  private convertSubcategoryFromDB(dbSubcategory: SubcategoryDB): Subcategory {
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
}
