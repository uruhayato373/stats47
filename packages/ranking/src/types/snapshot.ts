import type { Survey } from "@stats47/database/server";

import type { RankingItem } from "./ranking-item";

export const RANKING_ITEMS_SNAPSHOT_KEY = "snapshots/ranking-items/all.json";
export const SURVEYS_SNAPSHOT_KEY = "snapshots/surveys/all.json";

export interface RankingItemsSnapshot {
  generatedAt: string;
  count: number;
  items: RankingItem[];
}

export interface SurveysSnapshot {
  generatedAt: string;
  count: number;
  surveys: Survey[];
}
