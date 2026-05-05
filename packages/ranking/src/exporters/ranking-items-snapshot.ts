import "server-only";

import { getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

import { parseRankingItemDB } from "../repositories/schemas/ranking-items.schemas";
import { metricAsRankingItemSelection } from "../repositories/shared/metric-as-ranking-item-selection";
import type { RankingItem } from "../types/ranking-item";
import {
  RANKING_ITEMS_SNAPSHOT_KEY,
  type RankingItemsSnapshot,
} from "../types/snapshot";

export interface ExportRankingItemsSnapshotResult {
  key: string;
  count: number;
  parseFailures: number;
  sizeBytes: number;
  durationMs: number;
}

/**
 * metrics テーブルから RankingItemsSnapshot 形式で R2 に保存する (PR-5)
 *
 * 出力形式: snapshots/ranking-items/all.json
 * tags: metrics.tags (JSON配列) を直接使用
 *
 * dryRun=true の場合は R2 に書かず、JSON body と count のみ返す。
 */
export async function exportRankingItemsSnapshot(
  options: {
    db?: ReturnType<typeof getDrizzle>;
    dryRun?: boolean;
  } = {},
): Promise<ExportRankingItemsSnapshotResult & { body?: string }> {
  const startedAt = Date.now();
  const drizzleDb = options.db ?? getDrizzle();
  const dryRun = options.dryRun ?? false;

  const rows = await drizzleDb
    .select({ ...metricAsRankingItemSelection, tags: metrics.tags })
    .from(metrics);

  const items: RankingItem[] = [];
  let parseFailures = 0;
  for (const row of rows) {
    try {
      const parsed = parseRankingItemDB({
        ...row,
        data_source_id: "estat",
      });
      const tagKeys = JSON.parse(row.tags ?? "[]") as string[];
      if (tagKeys.length > 0) {
        parsed.tags = tagKeys.map((tagKey) => ({ tagKey }));
      }
      items.push(parsed);
    } catch (error) {
      parseFailures++;
      logger.warn(
        {
          rankingKey: row.ranking_key,
          error: error instanceof Error ? error.message : String(error),
        },
        "metrics: parseRankingItemDB が失敗。スキップ",
      );
    }
  }

  items.sort((a, b) => a.rankingKey < b.rankingKey ? -1 : a.rankingKey > b.rankingKey ? 1 : 0);

  const snapshot: RankingItemsSnapshot = {
    generatedAt: new Date().toISOString(),
    count: items.length,
    items,
  };

  const body = JSON.stringify(snapshot);

  if (dryRun) {
    return {
      key: RANKING_ITEMS_SNAPSHOT_KEY,
      count: items.length,
      parseFailures,
      sizeBytes: Buffer.byteLength(body, "utf8"),
      durationMs: Date.now() - startedAt,
      body,
    };
  }

  const result = await saveToR2(RANKING_ITEMS_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      key: result.key,
      count: items.length,
      parseFailures,
      sizeBytes: result.size,
      durationMs,
    },
    "ranking_items snapshot を R2 に保存しました",
  );

  return {
    key: result.key,
    count: items.length,
    parseFailures,
    sizeBytes: result.size,
    durationMs,
  };
}
