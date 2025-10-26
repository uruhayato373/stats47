/**
 * サブカテゴリページコンポーネントの共通型定義
 */

/**
 * サブカテゴリーの設定情報（categories.json構造）
 */
export interface SubcategoryConfig {
  id: string;
  name: string;
  href: string;
  dashboardComponent: string; // 必須
  nationalDashboardComponent?: string; // 全国用コンポーネント
  prefectureDashboardComponent?: string; // 都道府県用コンポーネント
  displayOrder: number;
}

/**
 * カテゴリーの設定情報（categories.json構造）
 */
export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: SubcategoryConfig[];
}

/**
 * ダッシュボードページのProps（簡略化）
 * category と subcategory は layout.tsx で処理されるため、areaCode のみ必要
 */
export interface SubcategoryDashboardPageProps {
  areaCode: string; // "00000" = 全国, その他 = 都道府県
}
