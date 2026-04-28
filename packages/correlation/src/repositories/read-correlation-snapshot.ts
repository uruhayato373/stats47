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

// snapshot を最後に更新してから何日経つと「古い」と扱うか。
// バッチが手動運用なので 1 ヶ月以上の停滞があれば調査トリガにする。
const STALE_AFTER_DAYS = 30;

function warnIfStale(generatedAt: string, key: string): void {
  const ageMs = Date.now() - new Date(generatedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { key, generatedAt, ageDays: Math.round(ageDays) },
      `correlation snapshot が ${STALE_AFTER_DAYS} 日以上更新されていません。バッチ再実行を検討してください`,
    );
  }
}

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

  warnIfStale(snapshot.generatedAt, CORRELATION_TOP_PAIRS_KEY);
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

  warnIfStale(snapshot.generatedAt, CORRELATION_STATS_KEY);
  return { total: snapshot.total, strong: snapshot.strong };
}
