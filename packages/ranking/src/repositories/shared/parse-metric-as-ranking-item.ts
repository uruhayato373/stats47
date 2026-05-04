import "server-only";

import { parseRankingItemDB } from "../schemas/ranking-items.schemas";

import type { RankingItem } from "../../types";

/**
 * metrics から SELECT した行 (metricAsRankingItemSelection で取得) を
 * 旧 RankingItem shape にパース (PR-5)
 *
 * data_source_id は metrics に存在しないため "estat" 固定で injection。
 */
export function parseMetricAsRankingItem(row: object): RankingItem {
  return parseRankingItemDB({ ...row, data_source_id: "estat" });
}
