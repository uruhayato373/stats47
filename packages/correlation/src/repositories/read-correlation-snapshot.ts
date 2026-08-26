import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";

import {
  CORRELATION_STATS_KEY,
  CORRELATION_TOP_PAIRS_KEY,
  parseCorrelationStatsSnapshot,
  parseCorrelationTopPairsSnapshot,
  type CorrelationStatsSnapshot,
  type CorrelationTopPairsSnapshot,
  type TopCorrelation,
} from "../types/snapshot";

/**
 * R2 上の correlation snapshot から上位 N 件を読み出す。
 *
 * snapshot 不在 / fetch 失敗時は空配列。フォールバック側で空表示すること。
 * D1 へは一切クエリしない（D1 read 課金回避が目的）。
 */
export async function readTopCorrelationsFromR2(
  limit = 20,
): Promise<TopCorrelation[]> {
  const result =
    await createSnapshotReader<CorrelationTopPairsSnapshot, CorrelationTopPairsSnapshot>({
      key: CORRELATION_TOP_PAIRS_KEY,
      label: "correlation-top-pairs",
      parse: parseCorrelationTopPairsSnapshot,
      select: (value) => value,
    }).readResult();

  if (result.status === "no-data") {
    logger.warn(
      { key: CORRELATION_TOP_PAIRS_KEY },
      "correlation top-pairs snapshot が R2 に存在しません。空配列を返します。",
    );
    return [];
  }
  if (result.status === "source-unavailable" || result.status === "schema-invalid") {
    throw result.error;
  }
  return result.data.pairs.slice(0, limit);
}

/**
 * R2 上の correlation snapshot から統計値（全件・強相関件数）を読み出す。
 */
export async function readCorrelationStatsFromR2(): Promise<{
  total: number;
  strong: number;
}> {
  const result =
    await createSnapshotReader<CorrelationStatsSnapshot, CorrelationStatsSnapshot>({
      key: CORRELATION_STATS_KEY,
      label: "correlation-stats",
      parse: parseCorrelationStatsSnapshot,
      select: (value) => value,
    }).readResult();

  if (result.status === "no-data") {
    logger.warn(
      { key: CORRELATION_STATS_KEY },
      "correlation stats snapshot が R2 に存在しません。0 を返します。",
    );
    return { total: 0, strong: 0 };
  }
  if (result.status === "source-unavailable" || result.status === "schema-invalid") {
    throw result.error;
  }
  return { total: result.data.total, strong: result.data.strong };
}
