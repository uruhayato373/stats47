import "server-only";

import { listCategories } from "@stats47/data-configs";
import { logger } from "@stats47/logger/server";
import { carryTimestamp, readPublishedSnapshot, writeR2Staging } from "@stats47/r2-storage/server";

import type { Category } from "../types/category";
import {
  buildCategoriesSnapshot,
  CATEGORIES_SNAPSHOT_KEY,
} from "../types/snapshot";

export interface ExportCategoriesSnapshotResult {
  key: string;
  count: number;
  sizeBytes: number;
  durationMs: number;
}

/**
 * categories snapshot を R2 に書き出す (完全DBレス: docs/01_技術設計/02_データアーキテクチャ.md)。
 *
 * SSOT は D1 `categories` テーブルではなく git TS マスタ
 * (`@stats47/data-configs` の `listCategories()` = CATEGORIES, 17件 displayOrder 順, icon 込み)。
 */
export async function exportCategoriesSnapshot(): Promise<ExportCategoriesSnapshotResult> {
  const startedAt = Date.now();

  const categories: Category[] = listCategories().map((c) => ({
    categoryKey: c.categoryKey,
    categoryName: c.categoryName,
    icon: c.icon || undefined,
    displayOrder: c.displayOrder,
  }));

  // 中身が前回配信した版と同じなら generatedAt を引き継ぎ、同じバイト列にする (差分反映で送らない)
  const previous = await readPublishedSnapshot<{ generatedAt?: string }>(CATEGORIES_SNAPSHOT_KEY);
  const { value: snapshot } = carryTimestamp(
    (generatedAt) => buildCategoriesSnapshot(categories, generatedAt),
    previous ? { value: previous, timestamp: previous.generatedAt } : null,
    new Date().toISOString(),
  );

  const body = JSON.stringify(snapshot);
  const result = await writeR2Staging(CATEGORIES_SNAPSHOT_KEY, body);

  const durationMs = Date.now() - startedAt;
  logger.info(
    { key: result.key, count: categories.length, sizeBytes: result.size, durationMs },
    "categories snapshot (完全DBレス) を R2 に保存しました",
  );

  return {
    key: result.key,
    count: categories.length,
    sizeBytes: result.size,
    durationMs,
  };
}
