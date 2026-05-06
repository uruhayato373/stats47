import type { Source } from "@stats47/database/server";

import type { RankingItem } from "./ranking-item";
import type { RankingValue } from "./ranking-value";

export const RANKING_ITEMS_SNAPSHOT_KEY = "ranking-items/all.json";
export const SURVEYS_SNAPSHOT_KEY = "surveys/all.json";

export interface RankingItemsSnapshot {
  generatedAt: string;
  count: number;
  items: RankingItem[];
}

export interface SurveysSnapshot {
  generatedAt: string;
  count: number;
  surveys: Source[];
}

/**
 * ranking_values の key-level snapshot (1 file = 1 ranking_key × area_type、全年度を含む)。
 *
 * key: ranking-values/<rankingKey>/<areaType>.json
 * - prefecture: ~185KB (47行 × ~14年)
 * ファイル数: 2,151 (キー数のみ、旧 30K 比 93% 削減)
 */
export interface RankingValuesKeySnapshot {
  generatedAt: string;
  rankingKey: string;
  areaType: string;
  partitions: Array<{
    yearCode: string;
    count: number;
    values: RankingValue[];
  }>;
}

export function rankingValuesKeyPath(
  rankingKey: string,
  areaType: string,
): string {
  return `ranking-values/${encodeURIComponent(rankingKey)}/${encodeURIComponent(areaType)}.json`;
}

/** @deprecated rankingValuesKeyPath を使用してください */
export interface RankingValuesPartitionSnapshot {
  generatedAt: string;
  rankingKey: string;
  areaType: string;
  yearCode: string;
  count: number;
  values: RankingValue[];
}

/** @deprecated rankingValuesKeyPath を使用してください */
export function rankingValuesPartitionPath(
  rankingKey: string,
  areaType: string,
  yearCode: string,
): string {
  return `ranking-values/${encodeURIComponent(rankingKey)}/${encodeURIComponent(areaType)}/${encodeURIComponent(yearCode)}.json`;
}
