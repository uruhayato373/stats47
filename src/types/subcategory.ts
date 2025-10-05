/**
 * サブカテゴリページコンポーネントの共通型定義
 */

import { CategoryData, SubcategoryData } from './choropleth';

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
