import "server-only";

import { getDrizzle, metrics, taggings } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { eq, sql } from "drizzle-orm";

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
 * tags: taggings (taggable_type='metric') を indicator.id で join
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

  const [rows, tagRows] = await Promise.all([
    drizzleDb.select(metricAsRankingItemSelection).from(metrics),
    drizzleDb
      .select({
        rankingKey: metrics.key,
        areaType: metrics.areaType,
        tagKey: taggings.tagKey,
      })
      .from(taggings)
      .innerJoin(
        metrics,
        eq(taggings.taggableId, sql`CAST(${metrics.id} AS TEXT)`)
      )
      .where(eq(taggings.taggableType, "metric")),
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
      const parsed = parseRankingItemDB({
        ...row,
        data_source_id: "estat",
      });
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
        "metrics: parseRankingItemDB が失敗。スキップ",
      );
    }
  }

  items.sort((a, b) => {
    if (a.rankingKey !== b.rankingKey) return a.rankingKey < b.rankingKey ? -1 : 1;
    return a.areaType < b.areaType ? -1 : a.areaType > b.areaType ? 1 : 0;
  });

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
