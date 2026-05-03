import "server-only";

import { categories, getDrizzle } from "@stats47/database/server";
import { saveJsonSnapshot } from "@stats47/r2-storage/server";
import { asc } from "drizzle-orm";

import { convertCategoryFromDB } from "../repositories/convert-category-from-db";
import {
  CATEGORIES_SNAPSHOT_KEY,
  type CategoriesSnapshot,
} from "../types/snapshot";

import type { JsonSnapshotResult } from "@stats47/r2-storage/server";

export type ExportCategoriesSnapshotResult = JsonSnapshotResult;

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

  return saveJsonSnapshot({
    key: CATEGORIES_SNAPSHOT_KEY,
    data: snapshot,
    count: rows.length,
    label: "categories",
    startedAt,
  });
}
