/**
 * カテゴリサービスのテスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CategoryService } from "../category-service";
import type { Category, Subcategory } from "../types";

// テスト用のモックデータ
const mockCategories = [
  {
    id: "tech",
    name: "テクノロジー",
    icon: "💻",
    color: "blue",
    subcategories: [
      {
        id: "programming",
        name: "プログラミング",
        href: "/tech/programming",
        dashboardComponent: "ProgrammingDashboard",
        displayOrder: 1,
      },
      {
        id: "gadgets",
        name: "ガジェット",
        href: "/tech/gadgets",
        dashboardComponent: "GadgetsDashboard",
        displayOrder: 2,
      },
    ],
  },
  {
    id: "lifestyle",
    name: "ライフスタイル",
    icon: "🏠",
    color: "green",
    subcategories: [
      {
        id: "travel",
        name: "旅行",
        href: "/lifestyle/travel",
        dashboardComponent: "TravelDashboard",
        displayOrder: 1,
      },
    ],
  },
  {
    id: "empty",
    name: "空のカテゴリ",
    icon: "📦",
    color: "gray",
    subcategories: [],
  },
];

// モックデータを設定
beforeEach(() => {
  // CategoryServiceの内部データをモックデータで置き換え
  (CategoryService as any).categories = mockCategories;
});

describe("CategoryService", () => {
  describe("getAllCategories", () => {
    it("全てのカテゴリを取得できる", () => {
      const categories = CategoryService.getAllCategories();
      expect(categories).toHaveLength(3);
      expect(categories[0].id).toBe("tech");
      expect(categories[1].id).toBe("lifestyle");
      expect(categories[2].id).toBe("empty");
    });

    it("オプションなしで全カテゴリを取得できる", () => {
      const categories = CategoryService.getAllCategories();
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe("getCategoryById", () => {
    it("存在するカテゴリIDでカテゴリを取得できる", () => {
      const category = CategoryService.getCategoryById("tech");
      expect(category).not.toBeNull();
      expect(category?.id).toBe("tech");
      expect(category?.name).toBe("テクノロジー");
    });

    it("存在しないカテゴリIDでnullを返す", () => {
      const category = CategoryService.getCategoryById("nonexistent");
      expect(category).toBeNull();
    });

    it("空文字列でnullを返す", () => {
      const category = CategoryService.getCategoryById("");
      expect(category).toBeNull();
    });
  });

  describe("getSubcategoryById", () => {
    it("存在するサブカテゴリIDでサブカテゴリを取得できる", () => {
      const result = CategoryService.getSubcategoryById("programming");
      expect(result).not.toBeNull();
      expect(result?.category.id).toBe("tech");
      expect(result?.subcategory.id).toBe("programming");
      expect(result?.subcategory.name).toBe("プログラミング");
    });

    it("存在しないサブカテゴリIDでnullを返す", () => {
      const result = CategoryService.getSubcategoryById("nonexistent");
      expect(result).toBeNull();
    });

    it("空文字列でnullを返す", () => {
      const result = CategoryService.getSubcategoryById("");
      expect(result).toBeNull();
    });
  });

  describe("searchCategories", () => {
    it("カテゴリ名で検索できる", () => {
      const categories = CategoryService.getAllCategories();
      const results = CategoryService.searchCategories(categories, {
        query: "テクノロジー",
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("tech");
    });

    it("部分一致で検索できる", () => {
      const categories = CategoryService.getAllCategories();
      const results = CategoryService.searchCategories(categories, {
        query: "テク",
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("tech");
    });

    it("サブカテゴリ名でも検索できる", () => {
      const categories = CategoryService.getAllCategories();
      const results = CategoryService.searchCategories(categories, {
        query: "プログラミング",
        includeSubcategories: true,
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("tech");
    });

    it("大文字小文字を区別しない", () => {
      const categories = CategoryService.getAllCategories();
      const results = CategoryService.searchCategories(categories, {
        query: "TECH",
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("tech");
    });

    it("空のクエリで全カテゴリを返す", () => {
      const categories = CategoryService.getAllCategories();
      const results = CategoryService.searchCategories(categories, {
        query: "",
      });
      expect(results).toHaveLength(3);
    });
  });

  describe("filterCategories", () => {
    it("サブカテゴリを持つカテゴリをフィルタできる", () => {
      const categories = CategoryService.getAllCategories();
      const filtered = CategoryService.filterCategories(categories, {
        hasSubcategories: true,
      });
      expect(filtered).toHaveLength(2); // tech, lifestyle
      expect(
        filtered.every(
          (cat) => cat.subcategories && cat.subcategories.length > 0
        )
      ).toBe(true);
    });

    it("サブカテゴリを持たないカテゴリをフィルタできる", () => {
      const categories = CategoryService.getAllCategories();
      const filtered = CategoryService.filterCategories(categories, {
        hasSubcategories: false,
      });
      expect(filtered).toHaveLength(1); // empty
      expect(filtered[0].id).toBe("empty");
    });

    it("特定のカテゴリIDでフィルタできる", () => {
      const categories = CategoryService.getAllCategories();
      const filtered = CategoryService.filterCategories(categories, {
        categoryIds: ["tech", "lifestyle"],
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.map((cat) => cat.id)).toEqual(["tech", "lifestyle"]);
    });

    it("複数のフィルタ条件を組み合わせられる", () => {
      const categories = CategoryService.getAllCategories();
      const filtered = CategoryService.filterCategories(categories, {
        hasSubcategories: true,
        categoryIds: ["tech"],
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("tech");
    });
  });

  describe("sortCategories", () => {
    it("名前で昇順ソートできる", () => {
      const categories = CategoryService.getAllCategories();
      const sorted = CategoryService.sortCategories(categories, {
        field: "name",
        order: "asc",
      });
      expect(sorted[0].name).toBe("テクノロジー");
      expect(sorted[1].name).toBe("ライフスタイル");
      expect(sorted[2].name).toBe("空のカテゴリ");
    });

    it("名前で降順ソートできる", () => {
      const categories = CategoryService.getAllCategories();
      const sorted = CategoryService.sortCategories(categories, {
        field: "name",
        order: "desc",
      });
      expect(sorted[0].name).toBe("空のカテゴリ");
      expect(sorted[1].name).toBe("ライフスタイル");
      expect(sorted[2].name).toBe("テクノロジー");
    });

    it("IDでソートできる", () => {
      const categories = CategoryService.getAllCategories();
      const sorted = CategoryService.sortCategories(categories, {
        field: "id",
        order: "asc",
      });
      expect(sorted[0].id).toBe("empty");
      expect(sorted[1].id).toBe("lifestyle");
      expect(sorted[2].id).toBe("tech");
    });
  });

  describe("validateCategoryId", () => {
    it("有効なカテゴリIDでバリデーションが成功する", () => {
      const result = CategoryService.validateCategoryId("tech");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("無効なカテゴリIDでバリデーションが失敗する", () => {
      const result = CategoryService.validateCategoryId("nonexistent");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("空文字列でバリデーションが失敗する", () => {
      const result = CategoryService.validateCategoryId("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("カテゴリIDが指定されていません");
    });
  });

  describe("validateSubcategoryId", () => {
    it("有効なサブカテゴリIDでバリデーションが成功する", () => {
      const result = CategoryService.validateSubcategoryId("programming");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("無効なサブカテゴリIDでバリデーションが失敗する", () => {
      const result = CategoryService.validateSubcategoryId("nonexistent");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("空文字列でバリデーションが失敗する", () => {
      const result = CategoryService.validateSubcategoryId("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("サブカテゴリIDが指定されていません");
    });
  });

  describe("getCategoryStats", () => {
    it("カテゴリ統計情報を取得できる", () => {
      const stats = CategoryService.getCategoryStats();
      expect(stats.totalCategories).toBe(3);
      expect(stats.totalSubcategories).toBe(3); // programming, gadgets, travel
      expect(stats.categoriesWithSubcategories).toBe(2); // tech, lifestyle
      expect(stats.categoriesWithoutSubcategories).toBe(1); // empty
    });
  });

  describe("advancedSearch", () => {
    it("クエリで検索できる", () => {
      const result = CategoryService.advancedSearch({
        query: "テクノロジー",
      });
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].id).toBe("tech");
      expect(result.totalCount).toBe(1);
    });

    it("フィルタとソートを組み合わせられる", () => {
      const result = CategoryService.advancedSearch({
        hasSubcategories: true,
        field: "name",
        order: "asc",
      });
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].name).toBe("テクノロジー");
      expect(result.categories[1].name).toBe("ライフスタイル");
    });

    it("サブカテゴリも検索結果に含められる", () => {
      const result = CategoryService.advancedSearch({
        query: "プログラミング",
        includeSubcategories: true,
      });
      expect(result.categories).toHaveLength(1);
      expect(result.subcategories).toHaveLength(1);
      expect(result.subcategories[0].name).toBe("プログラミング");
    });
  });

  describe("existsCategory", () => {
    it("存在するカテゴリIDでtrueを返す", () => {
      expect(CategoryService.existsCategory("tech")).toBe(true);
    });

    it("存在しないカテゴリIDでfalseを返す", () => {
      expect(CategoryService.existsCategory("nonexistent")).toBe(false);
    });
  });

  describe("existsSubcategory", () => {
    it("存在するサブカテゴリIDでtrueを返す", () => {
      expect(CategoryService.existsSubcategory("programming")).toBe(true);
    });

    it("存在しないサブカテゴリIDでfalseを返す", () => {
      expect(CategoryService.existsSubcategory("nonexistent")).toBe(false);
    });
  });
});
