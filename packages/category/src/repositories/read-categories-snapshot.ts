import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";

import { type Category } from "../types/category";
import {
  CATEGORIES_SNAPSHOT_KEY,
  type CategoriesSnapshot,
} from "../types/snapshot";

const loadAll = createSnapshotReader<CategoriesSnapshot, Category[]>({
  key: CATEGORIES_SNAPSHOT_KEY,
  label: "categories",
  select: (snapshot) => snapshot.categories,
  fallback: [],
});

export async function readCategoriesFromR2(): Promise<Result<Category[], Error>> {
  try {
    return ok(await loadAll());
  } catch (error) {
    logger.error({ error }, "readCategoriesFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readCategoryByKeyFromR2(
  categoryKey: string,
): Promise<Result<Category | null, Error>> {
  try {
    const all = await loadAll();
    return ok(all.find((c) => c.categoryKey === categoryKey) ?? null);
  } catch (error) {
    logger.error({ error, categoryKey }, "readCategoryByKeyFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
