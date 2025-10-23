/**
 * カテゴリ管理サービス
 *
 * categories.jsonを使用した統計全体の統一的なカテゴリ管理機能を提供
 * 検索、フィルタリング、ソート、ナビゲーション、正規化、バリデーション機能を含む
 */

import categoriesData from "@/config/categories.json";
import { notFound } from "next/navigation";
import type {
  Category,
  CategoryFilterOptions,
  CategoryJsonItem,
  CategorySearchOptions,
  CategorySearchResult,
  CategorySortOptions,
  CategoryStats,
  CategoryValidationResult,
  NormalizedCategory,
  SidebarCategoryItem,
  Subcategory,
  SubcategorySearchResult,
  SubcategoryValidationResult,
} from "../types";

// データソース
const categories: CategoryJsonItem[] = categoriesData as CategoryJsonItem[];

/**
 * JSONデータをCategory型に変換するヘルパー関数
 */
function transformCategory(
  category: CategoryJsonItem,
  displayOrder: number
): Category {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    description: "",
    displayOrder,
    subcategories: (category.subcategories || []).map((sub) => ({
      id: sub.id,
      categoryId: category.id,
      name: sub.name,
      href: sub.href,
      displayOrder: sub.displayOrder || 0,
    })),
  };
}

/**
 * 全カテゴリを取得
 */
export function allCategories(options?: CategorySortOptions): Category[] {
  const transformedCategories = categories.map((category, index) =>
    transformCategory(category, index)
  );

  if (!options) {
    return transformedCategories;
  }

  return sortCategories(transformedCategories, options);
}

/**
 * IDでカテゴリを取得
 */
export function categoryById(id: string): Category | null {
  const categoryIndex = categories.findIndex((cat) => cat.id === id);
  if (categoryIndex === -1) {
    return null;
  }

  return transformCategory(categories[categoryIndex], categoryIndex);
}

/**
 * IDでサブカテゴリを取得（カテゴリ情報付き）
 */
export function subcategoryById(
  subcategoryId: string
): SubcategorySearchResult | null {
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const subcategory = category.subcategories?.find(
      (sub) => sub.id === subcategoryId
    );

    if (subcategory) {
      return {
        category: transformCategory(category, i),
        subcategory: {
          id: subcategory.id,
          categoryId: category.id,
          name: subcategory.name,
          href: subcategory.href,
          displayOrder: subcategory.displayOrder || 0,
        },
      };
    }
  }

  return null;
}

/**
 * カテゴリを検索
 */
export function searchCategories(
  options: CategorySearchOptions
): CategorySearchResult {
  const { query = "", includeSubcategories = false } = options;
  const queryLower = query.toLowerCase();

  const matchingCategories: Category[] = [];
  const matchingSubcategories: Subcategory[] = [];

  categories.forEach((category, index) => {
    const transformedCategory = transformCategory(category, index);
    let categoryMatches = false;

    // カテゴリ名で検索
    if (category.name.toLowerCase().includes(queryLower)) {
      matchingCategories.push(transformedCategory);
      categoryMatches = true;
    }

    // サブカテゴリで検索
    if (includeSubcategories && category.subcategories) {
      category.subcategories.forEach((sub) => {
        if (sub.name.toLowerCase().includes(queryLower)) {
          matchingSubcategories.push({
            id: sub.id,
            categoryId: category.id,
            name: sub.name,
            href: sub.href,
            displayOrder: sub.displayOrder || 0,
          });

          if (!categoryMatches) {
            matchingCategories.push(transformedCategory);
            categoryMatches = true;
          }
        }
      });
    }
  });

  return {
    categories: matchingCategories,
    subcategories: matchingSubcategories,
    totalCount: matchingCategories.length,
  };
}

/**
 * カテゴリをフィルタリング
 */
export function filterCategories(
  categories: Category[],
  options: CategoryFilterOptions
): Category[] {
  const { hasSubcategories, categoryIds } = options;

  return categories.filter((category) => {
    // サブカテゴリの有無でフィルタ
    if (hasSubcategories !== undefined) {
      const hasSubs = (category.subcategories?.length || 0) > 0;
      if (hasSubs !== hasSubcategories) {
        return false;
      }
    }

    // カテゴリIDでフィルタ
    if (categoryIds && categoryIds.length > 0) {
      return categoryIds.includes(category.id);
    }

    return true;
  });
}

/**
 * カテゴリをソート
 */
export function sortCategories(
  categories: Category[],
  options: CategorySortOptions
): Category[] {
  const { field, order } = options;

  return [...categories].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (field) {
      case "name":
        aValue = a.name;
        bValue = b.name;
        break;
      case "displayOrder":
        aValue = a.displayOrder || 0;
        bValue = b.displayOrder || 0;
        break;
      case "id":
        aValue = a.id;
        bValue = b.id;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return order === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return order === "asc" ? 1 : -1;
    }
    return 0;
  });
}

/**
 * カテゴリIDのバリデーション
 */
export function validateCategoryId(id: string): CategoryValidationResult {
  const errors: string[] = [];

  if (!id) {
    errors.push("カテゴリIDが設定されていません");
  } else if (!categoryById(id)) {
    errors.push(`カテゴリID '${id}' が見つかりません`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * サブカテゴリIDのバリデーション
 */
export function validateSubcategoryId(id: string): CategoryValidationResult {
  const errors: string[] = [];

  if (!id) {
    errors.push("サブカテゴリIDが設定されていません");
  } else if (!subcategoryById(id)) {
    errors.push(`サブカテゴリID '${id}' が見つかりません`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * カテゴリ統計情報を取得
 */
export function categoryStats(): CategoryStats {
  const allCats = allCategories();
  const totalCategories = allCats.length;
  const totalSubcategories = allCats.reduce(
    (sum, cat) => sum + (cat.subcategories?.length || 0),
    0
  );
  const categoriesWithSubcategories = allCats.filter(
    (cat) => (cat.subcategories?.length || 0) > 0
  ).length;
  const categoriesWithoutSubcategories =
    totalCategories - categoriesWithSubcategories;

  return {
    totalCategories,
    totalSubcategories,
    categoriesWithSubcategories,
    categoriesWithoutSubcategories,
  };
}

/**
 * 高度な検索（複数条件の組み合わせ）
 */
export function advancedSearch(
  searchOptions: CategorySearchOptions,
  filterOptions: CategoryFilterOptions,
  sortOptions: CategorySortOptions
): CategorySearchResult {
  const searchResult = searchCategories(searchOptions);
  const filteredCategories = filterCategories(
    searchResult.categories,
    filterOptions
  );
  const sortedCategories = sortCategories(filteredCategories, sortOptions);

  return {
    categories: sortedCategories,
    subcategories: searchResult.subcategories,
    totalCount: sortedCategories.length,
  };
}

/**
 * カテゴリの存在確認
 */
export function categoryExists(id: string): boolean {
  return categories.some((cat) => cat.id === id);
}

/**
 * サブカテゴリの存在確認
 */
export function subcategoryExists(id: string): boolean {
  return categories.some((cat) =>
    cat.subcategories?.some((sub) => sub.id === id)
  );
}

// ===== ナビゲーション機能 =====

/**
 * ナビゲーション表示用のカテゴリ一覧を取得
 * displayOrder順にソートされた状態で返す
 */
export function navigationCategories(): Category[] {
  return allCategories({
    field: "displayOrder",
    order: "asc",
  });
}

/**
 * サイドバーのカテゴリセクション用データを取得
 * ナビゲーションアイテムとして使用しやすい形式に変換
 */
export function sidebarCategories(): SidebarCategoryItem[] {
  const cats = navigationCategories();

  return cats.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon || "",
    color: category.color || "gray",
    href: `/${category.id}`,
    subcategories: category.subcategories?.map((sub) => ({
      id: sub.id,
      name: sub.name,
      href: sub.href || "",
    })),
  }));
}

// ===== データ正規化機能 =====

/**
 * カテゴリデータを正規化する
 * 必須フィールドにデフォルト値を設定し、型安全性を確保する
 */
export function normalizeCategoryData(category: Category): NormalizedCategory {
  return {
    id: category.id,
    name: category.name,
    description: category.description || "",
    icon: category.icon || "",
    color: category.color || "gray",
    displayOrder: category.displayOrder || 0,
    subcategories: category.subcategories || [],
  };
}

/**
 * 複数のカテゴリデータを一括で正規化する
 */
export function normalizeCategoriesData(
  categories: Category[]
): NormalizedCategory[] {
  return categories.map(normalizeCategoryData);
}

/**
 * カテゴリデータの検証を行う
 * 必須フィールドが存在するかチェック
 */
export function validateCategoryData(category: Category): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!category.id) {
    errors.push("カテゴリIDが設定されていません");
  }

  if (!category.name) {
    errors.push("カテゴリ名が設定されていません");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===== サブカテゴリバリデーション機能 =====

/**
 * サブカテゴリの存在確認と整合性チェックを行う
 */
export function validateSubcategory(
  categoryId: string,
  subcategoryId: string
): SubcategoryValidationResult {
  // サブカテゴリの存在確認
  const subcategoryData = subcategoryById(subcategoryId);

  if (!subcategoryData) {
    return {
      isValid: false,
      error: `サブカテゴリ '${subcategoryId}' が見つかりません`,
    };
  }

  // カテゴリIDとサブカテゴリIDの整合性チェック
  if (subcategoryData.category.id !== categoryId) {
    return {
      isValid: false,
      error: `サブカテゴリ '${subcategoryId}' はカテゴリ '${categoryId}' に属していません`,
    };
  }

  return {
    isValid: true,
    subcategoryData,
  };
}

/**
 * サブカテゴリのバリデーションを行い、無効な場合は404エラーを発生させる
 */
export function validateSubcategoryOrThrow(
  categoryId: string,
  subcategoryId: string
) {
  const result = validateSubcategory(categoryId, subcategoryId);

  if (!result.isValid) {
    console.warn(`サブカテゴリバリデーションエラー: ${result.error}`);
    notFound();
  }

  return result.subcategoryData!;
}
