/**
 * Rankingドメインの型定義
 */

export interface RankingItem {
  id: string;
  ranking_key: string;
  label: string;
  unit: string;
  description?: string;
  ranking_direction: "asc" | "desc";
  data_source_id: string;
  subcategory_id: string;
  is_active: boolean;
}

export interface RankingItemsSidebarProps {
  category: string;
  subcategory: string;
  className?: string;
}
