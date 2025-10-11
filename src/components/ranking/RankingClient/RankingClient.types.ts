import { SubcategoryData } from "@/types/choropleth";

/**
 * ランキングデータの基本構造
 */
export interface RankingData {
  statsDataId: string;
  cdCat01: string;
  unit: string;
  name: string;
}

/**
 * ランキングオプション（タブ項目）の構造
 */
export interface RankingOption<T extends string> {
  key: T;
  label: string;
}

/**
 * RankingClientコンポーネントのProps
 */
export interface RankingClientProps<T extends string> {
  rankings: Record<T, RankingData>;
  subcategory: SubcategoryData;
  activeRankingId: T;
  tabOptions: RankingOption<T>[];
  rankingItems?: Array<Record<string, unknown>>; // RankingItem[] - 編集用
  isAdmin?: boolean; // 管理者権限
}
