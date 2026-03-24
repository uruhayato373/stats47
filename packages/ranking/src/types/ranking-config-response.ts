import type { RankingItem } from "./ranking-item";

export interface RankingConfigResponse {
  category: {
    categoryKey: string;
    categoryName: string;
    defaultRankingKey: string;
  };
  rankingItems: (RankingItem | null)[];
}
