import "server-only";

import { parseRankingItemDB } from "../schemas/ranking-items.schemas";

import type { RankingItem } from "../../types";

/**
 * indicators から SELECT した行 (indicatorAsRankingItemSelection で取得) を
 * 旧 RankingItem shape にパース (PR-5)
 *
 * data_source_id は indicators に存在しないため "estat" 固定で injection。
 */
export function parseIndicatorAsRankingItem(row: object): RankingItem {
  return parseRankingItemDB({ ...row, data_source_id: "estat" });
}
