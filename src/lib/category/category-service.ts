/**
 * カテゴリ管理サービス
 *
 * categories.jsonを使用した統計全体の統一的なカテゴリ管理機能を提供
 * 検索、フィルタリング、ソート機能を含む
 */

import categoriesData from "@/config/categories.json";
import type {
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

/**
 * カテゴリ管理サービスクラス
 */
export class CategoryService {
  private static categories: CategoryJsonItem[] =
    categoriesData as CategoryJsonItem[];

  /**
   * JSONデータをCategory型に変換するヘルパー関数
   */
  private static transformCategory(
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
        dashboardComponent: sub.dashboardComponent,
      })),
    };
  }

  /**
   * 全てのカテゴリを取得
   *
   * @param options - 検索・フィルタ・ソートオプション
   * @returns カテゴリ一覧
   */
  static getAllCategories(
    options?: CategorySearchOptions &
      CategoryFilterOptions &
      CategorySortOptions
  ): Category[] {
    let categories = this.categories.map((category, index) =>
      this.transformCategory(category, index + 1)
    );

    // フィルタリング
    if (options) {
      categories = this.filterCategories(categories, options);

      // 検索
      if (options.query) {
        categories = this.searchCategories(categories, options);
      }

      // ソート
      if (options.field) {
        categories = this.sortCategories(categories, options);
      }
    }

    return categories;
  }

  /**
   * IDでカテゴリを取得
   *
   * @param id - カテゴリID
   * @returns カテゴリデータ（見つからない場合はnull）
   */
  static getCategoryById(id: string): Category | null {
    const category = this.categories.find((cat) => cat.id === id);
    if (!category) return null;

    const displayOrder = this.categories.indexOf(category) + 1;
    return this.transformCategory(category, displayOrder);
  }

  /**
   * IDでサブカテゴリを取得
   *
   * @param id - サブカテゴリID
   * @returns カテゴリとサブカテゴリのデータ（見つからない場合はnull）
   */
  static getSubcategoryById(id: string): SubcategorySearchResult | null {
    for (let i = 0; i < this.categories.length; i++) {
      const category = this.categories[i];
      const subcategory = category.subcategories?.find((sub) => sub.id === id);

      if (subcategory) {
        const transformedCategory = this.transformCategory(category, i + 1);
        const transformedSubcategory = transformedCategory.subcategories?.find(
          (sub) => sub.id === id
        );

        if (transformedSubcategory) {
          return {
            category: transformedCategory,
            subcategory: transformedSubcategory,
          };
        }
      }
    }
    return null;
  }

  /**
   * カテゴリ名で検索
   *
   * @param categories - 検索対象のカテゴリ一覧
   * @param options - 検索オプション
   * @returns 検索結果
   */
  static searchCategories(
    categories: Category[],
    options: CategorySearchOptions
  ): Category[] {
    if (!options.query) return categories;

    const query = options.query.toLowerCase();

    return categories.filter((category) => {
      // カテゴリ名で検索
      if (category.name.toLowerCase().includes(query)) {
        return true;
      }

      // サブカテゴリ名で検索（オプション）
      if (options.includeSubcategories && category.subcategories) {
        return category.subcategories.some((sub) =>
          sub.name.toLowerCase().includes(query)
        );
      }

      return false;
    });
  }

  /**
   * カテゴリをフィルタリング
   *
   * @param categories - フィルタ対象のカテゴリ一覧
   * @param options - フィルタオプション
   * @returns フィルタ結果
   */
  static filterCategories(
    categories: Category[],
    options: CategoryFilterOptions
  ): Category[] {
    let filtered = categories;

    // サブカテゴリの有無でフィルタ
    if (options.hasSubcategories !== undefined) {
      filtered = filtered.filter((category) => {
        const hasSubs =
          category.subcategories && category.subcategories.length > 0;
        return options.hasSubcategories ? hasSubs : !hasSubs;
      });
    }

    // 特定のカテゴリIDでフィルタ
    if (options.categoryIds && options.categoryIds.length > 0) {
      filtered = filtered.filter((category) =>
        options.categoryIds!.includes(category.id)
      );
    }

    return filtered;
  }

  /**
   * カテゴリをソート
   *
   * @param categories - ソート対象のカテゴリ一覧
   * @param options - ソートオプション
   * @returns ソート結果
   */
  static sortCategories(
    categories: Category[],
    options: CategorySortOptions
  ): Category[] {
    return [...categories].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (options.field) {
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

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return options.order === "asc" ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return options.order === "asc" ? comparison : -comparison;
      }
    });
  }

  /**
   * カテゴリIDのバリデーション
   *
   * @param id - カテゴリID
   * @returns バリデーション結果
   */
  static validateCategoryId(id: string): CategoryValidationResult {
    const errors: string[] = [];

    if (!id) {
      errors.push("カテゴリIDが指定されていません");
    } else if (typeof id !== "string") {
      errors.push("カテゴリIDは文字列である必要があります");
    } else if (!this.categories.some((cat) => cat.id === id)) {
      errors.push(`カテゴリID "${id}" が見つかりません`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * サブカテゴリIDのバリデーション
   *
   * @param id - サブカテゴリID
   * @returns バリデーション結果
   */
  static validateSubcategoryId(id: string): CategoryValidationResult {
    const errors: string[] = [];

    if (!id) {
      errors.push("サブカテゴリIDが指定されていません");
    } else if (typeof id !== "string") {
      errors.push("サブカテゴリIDは文字列である必要があります");
    } else if (!this.getSubcategoryById(id)) {
      errors.push(`サブカテゴリID "${id}" が見つかりません`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * カテゴリ統計情報を取得
   *
   * @returns カテゴリ統計情報
   */
  static getCategoryStats(): CategoryStats {
    const categories = this.getAllCategories();
    const totalCategories = categories.length;
    const totalSubcategories = categories.reduce(
      (sum, cat) => sum + (cat.subcategories?.length || 0),
      0
    );
    const categoriesWithSubcategories = categories.filter(
      (cat) => cat.subcategories && cat.subcategories.length > 0
    ).length;

    return {
      totalCategories,
      totalSubcategories,
      categoriesWithSubcategories,
      categoriesWithoutSubcategories:
        totalCategories - categoriesWithSubcategories,
    };
  }

  /**
   * 高度な検索機能
   *
   * @param options - 検索・フィルタ・ソートオプション
   * @returns 検索結果
   */
  static advancedSearch(
    options: CategorySearchOptions & CategoryFilterOptions & CategorySortOptions
  ): CategorySearchResult {
    let categories = this.getAllCategories();
    let subcategories: Subcategory[] = [];

    // フィルタリング
    categories = this.filterCategories(categories, options);

    // 検索
    if (options.query) {
      categories = this.searchCategories(categories, options);

      // サブカテゴリも検索結果に含める
      if (options.includeSubcategories) {
        subcategories = categories
          .flatMap((cat) => cat.subcategories || [])
          .filter((sub) =>
            sub.name.toLowerCase().includes(options.query!.toLowerCase())
          );
      }
    }

    // ソート
    if (options.field) {
      categories = this.sortCategories(categories, options);
    }

    return {
      categories,
      subcategories,
      totalCount: categories.length,
    };
  }

  /**
   * カテゴリの存在確認
   *
   * @param id - カテゴリID
   * @returns 存在するかどうか
   */
  static existsCategory(id: string): boolean {
    return this.categories.some((cat) => cat.id === id);
  }

  /**
   * サブカテゴリの存在確認
   *
   * @param id - サブカテゴリID
   * @returns 存在するかどうか
   */
  static existsSubcategory(id: string): boolean {
    return this.getSubcategoryById(id) !== null;
  }
}
