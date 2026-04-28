import "server-only";

import { getDrizzle, rankingItems } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

import { parseRankingItemDB } from "../repositories/schemas/ranking-items.schemas";
import { rankingItemSelection } from "../repositories/shared/ranking-item-selection";
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

export async function exportRankingItemsSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportRankingItemsSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb.select(rankingItemSelection).from(rankingItems);

  const items: RankingItem[] = [];
  let parseFailures = 0;
  for (const row of rows) {
    try {
      items.push(parseRankingItemDB(row));
    } catch (error) {
      parseFailures++;
      logger.warn(
        {
          rankingKey: row.ranking_key,
          areaType: row.area_type,
          error: error instanceof Error ? error.message : String(error),
        },
        "ranking_items: parseRankingItemDB が失敗。スキップ",
      );
    }
  }

  const snapshot: RankingItemsSnapshot = {
    generatedAt: new Date().toISOString(),
    count: items.length,
    items,
  };

  const body = JSON.stringify(snapshot);
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
