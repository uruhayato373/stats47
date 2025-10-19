/**
 * カテゴリ管理システムのエクスポート
 *
 * 統計全体で共通のカテゴリ・サブカテゴリ管理機能を提供
 */

// 型定義のエクスポート
export type {
  Category,
  Subcategory,
  CategorySearchOptions,
  CategorySortOptions,
  CategoryFilterOptions,
  CategorySearchResult,
  SubcategorySearchResult,
  CategoryValidationResult,
  CategoryStats,
  CategoryJsonItem,
} from "./types";

// サービスクラスのエクスポート
export { CategoryService } from "./category-service";

// 便利な関数のエクスポート（後方互換性のため）
import { CategoryService } from "./category-service";

export const getCategoryById =
  CategoryService.getCategoryById.bind(CategoryService);
export const getSubcategoryById =
  CategoryService.getSubcategoryById.bind(CategoryService);
export const getAllCategories =
  CategoryService.getAllCategories.bind(CategoryService);
export const searchCategories =
  CategoryService.searchCategories.bind(CategoryService);
export const filterCategories =
  CategoryService.filterCategories.bind(CategoryService);
export const sortCategories =
  CategoryService.sortCategories.bind(CategoryService);
export const validateCategoryId =
  CategoryService.validateCategoryId.bind(CategoryService);
export const validateSubcategoryId =
  CategoryService.validateSubcategoryId.bind(CategoryService);
export const getCategoryStats =
  CategoryService.getCategoryStats.bind(CategoryService);
export const advancedSearch =
  CategoryService.advancedSearch.bind(CategoryService);
export const existsCategory =
  CategoryService.existsCategory.bind(CategoryService);
export const existsSubcategory =
  CategoryService.existsSubcategory.bind(CategoryService);

// ナビゲーション用関数のエクスポート
export {
  getNavigationCategories,
  getCategoriesForSidebar,
  type SidebarCategoryItem,
} from "./navigation";
