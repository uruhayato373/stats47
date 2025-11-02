/**
 * ランキング共有型定義
 * 
 * ランキングドメイン全体で共有される型定義をここに配置
 */

// ランキングサイドバーのProps型定義
export interface RankingItemsSidebarProps {
  /** カテゴリID */
  category: string;
  /** サブカテゴリID */
  subcategory: string;
  /** クラス名 */
  className?: string;
}

