import "server-only";

import { getMetricMeta } from "@stats47/data-configs";

import { parseRankingItemDB } from "../schemas/ranking-items.schemas";

import type { RankingItem } from "../../types";

/**
 * metrics から SELECT した行 (metricAsRankingItemSelection で取得) を
 * 旧 RankingItem shape にパース (PR-5)
 *
 * - data_source_id は metrics に存在しないため "estat" 固定で injection
 * - latestYear / availableYears は Phase 7 以降 TS-config 由来 (`getMetricMeta`) で enrichment
 *   (旧: SQL fragment が stats_prefecture から動的計算していたが、D1 stats_* DROP に伴い変更)
 */
export function parseMetricAsRankingItem(row: object): RankingItem {
  const r = row as { ranking_key?: string };
  const meta = r.ranking_key ? getMetricMeta(r.ranking_key) : null;

  const enriched = {
    ...row,
    data_source_id: "estat",
    // TS-config の years から enumerate (`years: "all"` の場合は空配列)
    latest_year: meta?.latestYear ?? null,
    available_years: meta?.availableYears ?? [],
  };

  return parseRankingItemDB(enriched);
}
