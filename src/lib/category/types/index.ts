/**
 * カテゴリ管理システムの型定義
 *
 * 統計全体で共通のカテゴリ・サブカテゴリ管理に使用される型定義
 */

/**
 * カテゴリの基本情報
 */
export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  displayOrder?: number;
  subcategories?: Subcategory[];
}

/**
 * サブカテゴリの基本情報
 */
export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  href?: string;
  displayOrder?: number;
  dashboardComponent?: string;
}

/**
 * カテゴリ検索オプション
 */
export interface CategorySearchOptions {
  query?: string;
  includeSubcategories?: boolean;
}

/**
 * カテゴリソートオプション
 */
export interface CategorySortOptions {
  field: "name" | "displayOrder" | "id";
  order: "asc" | "desc";
}

/**
 * カテゴリフィルタオプション
 */
export interface CategoryFilterOptions {
  hasSubcategories?: boolean;
  categoryIds?: string[];
}

/**
 * カテゴリ検索結果
 */
export interface CategorySearchResult {
  categories: Category[];
  subcategories: Subcategory[];
  totalCount: number;
}

/**
 * サブカテゴリ検索結果（カテゴリ情報付き）
 */
export interface SubcategorySearchResult {
  category: Category;
  subcategory: Subcategory;
}

/**
 * categories.jsonの生データ構造
 */
export interface CategoryJsonItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  subcategories?: Array<{
    id: string;
    name: string;
    href?: string;
    dashboardComponent?: string;
    displayOrder?: number;
  }>;
}

/**
 * カテゴリバリデーション結果
 */
export interface CategoryValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * カテゴリ統計情報
 */
export interface CategoryStats {
  totalCategories: number;
  totalSubcategories: number;
  categoriesWithSubcategories: number;
  categoriesWithoutSubcategories: number;
}
