import type { Survey } from "@stats47/database/server";

import type { RankingItem } from "./ranking-item";
import type { RankingValue } from "./ranking-value";

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

/**
 * ranking_values の partition snapshot (1 partition = 1 ranking_key × area_type × year_code)。
 *
 * key: snapshots/ranking-values/<rankingKey>/<areaType>/<yearCode>.json
 * - prefecture: 47 行 / file (~13KB)
 * - city: ~1,900 行 / file (~550KB)
 * 全 partition 数: ~33,361 (2026-04 時点 3.3M 行 / 33K = 約 100 行/partition 平均)
 */
export interface RankingValuesPartitionSnapshot {
  generatedAt: string;
  rankingKey: string;
  areaType: string;
  yearCode: string;
  count: number;
  values: RankingValue[];
}

export function rankingValuesPartitionPath(
  rankingKey: string,
  areaType: string,
  yearCode: string,
): string {
  // ファイル名は yearCode をそのまま使用 (e-Stat 形式 "2023100000" もそのまま)
  return `snapshots/ranking-values/${encodeURIComponent(rankingKey)}/${encodeURIComponent(areaType)}/${encodeURIComponent(yearCode)}.json`;
}
