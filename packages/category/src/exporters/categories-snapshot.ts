import "server-only";

import { categories, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { asc } from "drizzle-orm";

import { convertCategoryFromDB } from "../repositories/convert-category-from-db";
import {
  CATEGORIES_SNAPSHOT_KEY,
  type CategoriesSnapshot,
} from "../types/snapshot";

export interface ExportCategoriesSnapshotResult {
  key: string;
  count: number;
  sizeBytes: number;
  durationMs: number;
}

export async function exportCategoriesSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportCategoriesSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb
    .select()
    .from(categories)
    .orderBy(asc(categories.displayOrder));

  const snapshot: CategoriesSnapshot = {
    generatedAt: new Date().toISOString(),
    count: rows.length,
    categories: rows.map(convertCategoryFromDB),
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(CATEGORIES_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      key: result.key,
      count: rows.length,
      sizeBytes: result.size,
      durationMs,
    },
    "categories snapshot を R2 に保存しました",
  );

  return {
    key: result.key,
    count: rows.length,
    sizeBytes: result.size,
    durationMs,
  };
}
