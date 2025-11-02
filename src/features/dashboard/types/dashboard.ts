/**
 * ダッシュボードドメインの型定義
 */

import type { AreaType } from "@/features/area/types";

/**
 * 地域レベル
 */
export type AreaLevel = "national" | "prefecture" | "municipality";

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
  /** 地域レベル */
  areaLevel: AreaLevel;
}

/**
 * ダッシュボードコンポーネントの型
 */
export type DashboardComponent = React.ComponentType<DashboardProps>;

