import "server-only";

import { getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { listActiveRankingKeys } from "@stats47/ranking/server";

import { findHighlyCorrelated } from "../repositories/find-highly-correlated";
import {
  CORRELATION_BY_KEY_LIMIT,
  CORRELATION_BY_KEY_PREFIX,
  type CorrelationByKeySnapshot,
  correlationByKeyPath,
} from "../types/snapshot";

export interface ExportPerKeyResult {
  totalKeys: number;
  succeeded: number;
  failed: number;
  totalBytes: number;
  durationMs: number;
}

// ローカル D1 (better-sqlite3) は同期的に動くが、saveToR2 は HTTP I/O。
// 過剰な並列で R2 API rate limit を踏まないよう適度に制限。
const SAVE_CONCURRENCY = 8;

/**
 * 各 active ranking_key について `findHighlyCorrelated(key, 20)` 相当の集計を実行し、
 * 結果を `snapshots/correlation/by-ranking-key/<rankingKey>.json` に保存する。
 *
 * Web (CorrelationSection) はこの snapshot を fetch するだけになり、
 * D1 への indexed lookup も含めて完全に消える。
 *
 * 実行は 1,830 ranking_key × 1 read + 1,830 PutObject。後者は無料枠 1M/月 内。
 */
export async function exportCorrelationPerKeySnapshots(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportPerKeyResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const keysResult = await listActiveRankingKeys("prefecture", drizzleDb);
  if (!keysResult.success) {
    throw new Error(
      `active ranking_keys の取得に失敗: ${keysResult.error?.message ?? "unknown"}`,
    );
  }
  const keys = keysResult.data.map((row) => row.rankingKey);

  const generatedAt = new Date().toISOString();
  let succeeded = 0;
  let failed = 0;
  let totalBytes = 0;

  // 並列度制御の簡易キュー
  let cursor = 0;
  async function worker() {
    while (cursor < keys.length) {
      const idx = cursor++;
      const rankingKey = keys[idx];
      try {
        const result = await findHighlyCorrelated(
          rankingKey,
          CORRELATION_BY_KEY_LIMIT,
          drizzleDb,
        );
        if (!result.success) {
          throw result.error ?? new Error("findHighlyCorrelated returned err");
        }

        const snapshot: CorrelationByKeySnapshot = {
          generatedAt,
          rankingKey,
          pairs: result.data,
        };
        const body = JSON.stringify(snapshot);
        const saved = await saveToR2(correlationByKeyPath(rankingKey), body, {
          contentType: "application/json; charset=utf-8",
        });
        succeeded++;
        totalBytes += saved.size;
      } catch (error) {
        failed++;
        logger.error(
          {
            rankingKey,
            error: error instanceof Error ? error.message : String(error),
          },
          "per-key correlation snapshot の保存に失敗",
        );
      }
    }
  }

  const workers = Array.from({ length: SAVE_CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      prefix: CORRELATION_BY_KEY_PREFIX,
      totalKeys: keys.length,
      succeeded,
      failed,
      totalBytes,
      durationMs,
    },
    "per-key correlation snapshot を R2 に保存しました",
  );

  return {
    totalKeys: keys.length,
    succeeded,
    failed,
    totalBytes,
    durationMs,
  };
}
