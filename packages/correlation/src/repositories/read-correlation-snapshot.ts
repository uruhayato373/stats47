import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import {
  CORRELATION_STATS_KEY,
  CORRELATION_TOP_PAIRS_KEY,
  type CorrelationStatsSnapshot,
  type CorrelationTopPairsSnapshot,
} from "../types/snapshot";
import type { TopCorrelation } from "./list-top-correlations";

/**
 * R2 上の correlation snapshot から上位 N 件を読み出す。
 *
 * snapshot 不在 / fetch 失敗時は空配列。フォールバック側で空表示すること。
 * D1 へは一切クエリしない（D1 read 課金回避が目的）。
 */
export async function readTopCorrelationsFromR2(
  limit = 20,
): Promise<TopCorrelation[]> {
  const snapshot =
    await fetchFromR2AsJson<CorrelationTopPairsSnapshot>(CORRELATION_TOP_PAIRS_KEY);

  if (!snapshot) {
    logger.warn(
      { key: CORRELATION_TOP_PAIRS_KEY },
      "correlation top-pairs snapshot が R2 に存在しません。空配列を返します。",
    );
    return [];
  }

  return snapshot.pairs.slice(0, limit);
}

/**
 * R2 上の correlation snapshot から統計値（全件・強相関件数）を読み出す。
 */
export async function readCorrelationStatsFromR2(): Promise<{
  total: number;
  strong: number;
}> {
  const snapshot =
    await fetchFromR2AsJson<CorrelationStatsSnapshot>(CORRELATION_STATS_KEY);

  if (!snapshot) {
    logger.warn(
      { key: CORRELATION_STATS_KEY },
      "correlation stats snapshot が R2 に存在しません。0 を返します。",
    );
    return { total: 0, strong: 0 };
  }

  return { total: snapshot.total, strong: snapshot.strong };
}
