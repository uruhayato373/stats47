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
  dashboardComponent: string; // 必須
  rankingComponent: string; // 必須
  displayOrder: number;
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
 * ダッシュボードページのProps（全国・都道府県共通）
 */
export interface SubcategoryDashboardPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string; // "00000" = 全国, その他 = 都道府県
}

/**
 * ランキングページのProps
 */
export interface SubcategoryRankingPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  rankingId?: string; // 統計項目ID（オプション）
}

/**
 * 標準的なサブカテゴリページのProps（後方互換性のため維持）
 * @deprecated SubcategoryDashboardPageProps または SubcategoryRankingPageProps を使用してください
 */
export interface SubcategoryPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
}

/**
 * 都道府県別ページのProps（後方互換性のため維持）
 * @deprecated SubcategoryDashboardPageProps を使用してください
 */
export interface SubcategoryAreaPageProps {
  category: CategoryData;
  subcategory: SubcategoryData;
  areaCode: string;
}
