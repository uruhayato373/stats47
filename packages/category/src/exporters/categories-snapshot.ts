import "server-only";

import { listCategories } from "@stats47/data-configs";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";

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

  const snapshot = buildCategoriesSnapshot(categories);

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(CATEGORIES_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

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
