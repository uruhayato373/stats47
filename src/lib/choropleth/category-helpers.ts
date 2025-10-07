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
 * JSONデータをCategoryData型に変換するヘルパー関数
 *
 * @param {CategoryJsonItem} category - 変換するカテゴリJSONデータ
 * @param {number} displayOrder - 表示順序
 * @returns {CategoryData} 変換されたCategoryData
 */
function transformCategory(
  category: CategoryJsonItem,
  displayOrder: number
): CategoryData {
  return {
    id: category.id,
    name: category.name,
    description: "",
    icon: category.icon,
    displayOrder,
    subcategories: (category.subcategories || []).map((sub, subIndex) => ({
      id: sub.id,
      categoryId: category.id,
      name: sub.name,
      displayOrder: subIndex + 1,
      component: sub.component,
      areaComponent: sub.areaComponent,
    })),
  };
}

/**
 * カテゴリIDからカテゴリデータを取得
 *
 * @param {string} categoryId - カテゴリID
 * @returns {CategoryData | undefined} カテゴリデータ（見つからない場合はundefined）
 *
 * @example
 * const category = getCategoryById("population");
 * if (category) {
 *   console.log(category.name); // "人口・世帯"
 * }
 */
export function getCategoryById(categoryId: string): CategoryData | undefined {
  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) return undefined;

  const displayOrder = categories.indexOf(category) + 1;
  return transformCategory(category, displayOrder);
}

/**
 * サブカテゴリIDからサブカテゴリデータを取得
 *
 * @param {string} subcategoryId - サブカテゴリID
 * @returns {{category: CategoryData; subcategory: SubcategoryData} | undefined} カテゴリとサブカテゴリデータ（見つからない場合はundefined）
 *
 * @example
 * const data = getSubcategoryById("households");
 * if (data) {
 *   console.log(data.category.name); // "人口・世帯"
 *   console.log(data.subcategory.name); // "世帯"
 * }
 */
export function getSubcategoryById(
  subcategoryId: string
): { category: CategoryData; subcategory: SubcategoryData } | undefined {
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    const subcategory = category.subcategories?.find(
      (sub) => sub.id === subcategoryId
    );
    if (subcategory) {
      const transformedCategory = transformCategory(category, i + 1);
      const transformedSubcategory = transformedCategory.subcategories.find(
        (sub) => sub.id === subcategoryId
      )!;
      return {
        category: transformedCategory,
        subcategory: transformedSubcategory,
      };
    }
  }
  return undefined;
}

/**
 * カテゴリの表示順でソートされたカテゴリ一覧を取得
 *
 * @returns {CategoryData[]} 表示順でソートされたカテゴリ一覧
 *
 * @example
 * const sortedCategories = getSortedCategories();
 * sortedCategories.forEach(category => {
 *   console.log(`${category.displayOrder}. ${category.name}`);
 * });
 */
export function getSortedCategories(): CategoryData[] {
  return categories.map((category, index) =>
    transformCategory(category, index + 1)
  );
}
