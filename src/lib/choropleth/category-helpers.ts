/**
 * カテゴリとサブカテゴリのヘルパー関数
 * categories.json のみを使用（基本情報のみ）
 * 詳細情報（unit, statsDataId等）は各サブカテゴリページで定義
 */

import categoriesData from "@/config/categories.json";
import { CategoryData, SubcategoryData } from "@/types/choropleth";

interface CategoryJsonItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories?: Array<{
    id: string;
    name: string;
    href: string;
    component: string;
    areaComponent?: string;
  }>;
}

const categories = categoriesData as CategoryJsonItem[];

/**
 * JSONデータをCategoryData型に変換
 */
function transformToCategories(): CategoryData[] {
  return categories.map((cat, index) => ({
    id: cat.id,
    name: cat.name,
    description: "",
    icon: cat.icon,
    displayOrder: index + 1,
    subcategories: (cat.subcategories || []).map((sub, subIndex) => ({
      id: sub.id,
      categoryId: cat.id,
      name: sub.name,
      displayOrder: subIndex + 1,
      component: sub.component,
      areaComponent: sub.areaComponent,
    })),
  }));
}

/**
 * カテゴリIDからカテゴリデータを取得
 */
export function getCategoryById(categoryId: string): CategoryData | undefined {
  const transformedCategories = transformToCategories();
  return transformedCategories.find((cat) => cat.id === categoryId);
}

/**
 * サブカテゴリIDからサブカテゴリデータを取得
 */
export function getSubcategoryById(
  subcategoryId: string
): { category: CategoryData; subcategory: SubcategoryData } | undefined {
  const transformedCategories = transformToCategories();
  for (const category of transformedCategories) {
    const subcategory = category.subcategories.find(
      (sub) => sub.id === subcategoryId
    );
    if (subcategory) {
      return { category, subcategory };
    }
  }
  return undefined;
}

/**
 * カテゴリの表示順でソートされたカテゴリ一覧を取得
 */
export function getSortedCategories(): CategoryData[] {
  const transformedCategories = transformToCategories();
  return [...transformedCategories].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
}
