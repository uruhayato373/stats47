import "server-only";

import { getDrizzle, rankingItems, rankingTags } from "@stats47/database/server";
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

  const [rows, tagRows] = await Promise.all([
    drizzleDb.select(rankingItemSelection).from(rankingItems),
    drizzleDb
      .select({
        rankingKey: rankingTags.rankingKey,
        areaType: rankingTags.areaType,
        tagKey: rankingTags.tagKey,
      })
      .from(rankingTags),
  ]);

  const tagsByItem = new Map<string, { tagKey: string }[]>();
  for (const t of tagRows) {
    const key = `${t.rankingKey}|${t.areaType}`;
    const list = tagsByItem.get(key) ?? [];
    list.push({ tagKey: t.tagKey });
    tagsByItem.set(key, list);
  }

  const items: RankingItem[] = [];
  let parseFailures = 0;
  for (const row of rows) {
    try {
      const parsed = parseRankingItemDB(row);
      const tagKey = `${parsed.rankingKey}|${parsed.areaType}`;
      const tags = tagsByItem.get(tagKey);
      if (tags && tags.length > 0) parsed.tags = tags;
      items.push(parsed);
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
