import "server-only";

import { getDrizzle } from "@stats47/database/server";
import { savePartitionedJsonSnapshots } from "@stats47/r2-storage/server";
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

const SAVE_CONCURRENCY = 8;

/**
 * 各 active ranking_key について `findHighlyCorrelated(key, 20)` を実行し、
 * 結果を `snapshots/correlation/by-ranking-key/<rankingKey>.json` に保存する。
 */
export async function exportCorrelationPerKeySnapshots(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportPerKeyResult> {
  const drizzleDb = db ?? getDrizzle();

  const keysResult = await listActiveRankingKeys("prefecture", drizzleDb);
  if (!keysResult.success) {
    throw new Error(
      `active ranking_keys の取得に失敗: ${keysResult.error?.message ?? "unknown"}`,
    );
  }
  const keys = keysResult.data.map((row) => row.rankingKey);
  const generatedAt = new Date().toISOString();

  async function* tasks() {
    for (const rankingKey of keys) {
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
      yield {
        key: correlationByKeyPath(rankingKey),
        data: snapshot,
      };
    }
  }

  const result = await savePartitionedJsonSnapshots({
    tasks: tasks(),
    totalHint: keys.length,
    concurrency: SAVE_CONCURRENCY,
    label: `per-key correlation (${CORRELATION_BY_KEY_PREFIX})`,
    progressInterval: 200,
  });

  return {
    totalKeys: keys.length,
    succeeded: result.succeeded,
    failed: result.failed,
    totalBytes: result.totalBytes,
    durationMs: result.durationMs,
  };
}
