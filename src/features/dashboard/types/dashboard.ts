/**
 * ダッシュボードドメインの型定義
 */

import type { AreaType } from "@/features/area/types";

/**
 * ダッシュボードコンポーネントのProps
 */
export interface DashboardProps {
  /** カテゴリキー */
  category: string;
  /** サブカテゴリキー */
  subcategory: string;
  /** 地域コード */
  areaCode: string;
  /** 地域タイプ */
  areaType: AreaType;
}

/**
 * ダッシュボードコンポーネントの型
 */
export type DashboardComponent = React.ComponentType<DashboardProps>;

