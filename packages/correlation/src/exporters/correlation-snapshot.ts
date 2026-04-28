import "server-only";

import { correlationAnalysis, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { count, sql } from "drizzle-orm";

import { listTopCorrelations } from "../repositories/list-top-correlations";
import {
  CORRELATION_STATS_KEY,
  CORRELATION_TOP_PAIRS_KEY,
  CORRELATION_TOP_PAIRS_SNAPSHOT_LIMIT,
  type CorrelationStatsSnapshot,
  type CorrelationTopPairsSnapshot,
} from "../types/snapshot";

export interface ExportCorrelationSnapshotResult {
  topPairs: { key: string; sizeBytes: number; pairCount: number };
  stats: { key: string; sizeBytes: number };
  durationMs: number;
}

/**
 * correlation_analysis の集計を 1 回だけクエリし、
 * 上位ペアと統計値を R2 に snapshot として保存する。
 *
 * Web の /correlation ページはこの snapshot を fetch するだけになり、
 * D1 への full scan は走らなくなる。
 */
export async function exportCorrelationSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportCorrelationSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const [pairs, statsRows] = await Promise.all([
    listTopCorrelations(CORRELATION_TOP_PAIRS_SNAPSHOT_LIMIT, drizzleDb),
    drizzleDb
      .select({
        total: count(),
        strong: sql<number>`SUM(CASE WHEN ABS(${correlationAnalysis.pearsonR}) >= 0.7 THEN 1 ELSE 0 END)`,
      })
      .from(correlationAnalysis),
  ]);

  const generatedAt = new Date().toISOString();

  const topPairsSnapshot: CorrelationTopPairsSnapshot = {
    generatedAt,
    pairs,
  };
  const statsSnapshot: CorrelationStatsSnapshot = {
    generatedAt,
    total: statsRows[0]?.total ?? 0,
    strong: Number(statsRows[0]?.strong ?? 0),
  };

  const topPairsBody = JSON.stringify(topPairsSnapshot);
  const statsBody = JSON.stringify(statsSnapshot);

  const [topPairsResult, statsResult] = await Promise.all([
    saveToR2(CORRELATION_TOP_PAIRS_KEY, topPairsBody, {
      contentType: "application/json; charset=utf-8",
    }),
    saveToR2(CORRELATION_STATS_KEY, statsBody, {
      contentType: "application/json; charset=utf-8",
    }),
  ]);

  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      pairCount: pairs.length,
      total: statsSnapshot.total,
      strong: statsSnapshot.strong,
      topPairsBytes: topPairsResult.size,
      statsBytes: statsResult.size,
      durationMs,
    },
    "correlation snapshot を R2 に保存しました",
  );

  return {
    topPairs: {
      key: topPairsResult.key,
      sizeBytes: topPairsResult.size,
      pairCount: pairs.length,
    },
    stats: {
      key: statsResult.key,
      sizeBytes: statsResult.size,
    },
    durationMs,
  };
}
