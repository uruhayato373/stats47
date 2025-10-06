/**
 * サブカテゴリページコンポーネントの共通型定義
 */

import { CategoryData, SubcategoryData } from "./choropleth";

/**
 * サブカテゴリーの設定情報
 */
export interface SubcategoryConfig {
  id: string;
  name: string;
  href: string;
  component: string;
  areaComponent?: string;
}

/**
 * カテゴリーの設定情報
 */
export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: SubcategoryConfig[];
}

/**
 * 標準的なサブカテゴリページのProps
 */
export interface SubcategoryPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  currentYear: string;
}

/**
 * 都道府県別ページのProps（areaCodeが追加される）
 */
export interface SubcategoryAreaPageProps extends SubcategoryPageProps {
  areaCode: string;
}
