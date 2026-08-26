import "server-only";

import { logger } from "@stats47/logger/server";
import {
  createSnapshotReader,
  type SnapshotReadResult,
} from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";

import { type Category } from "../types/category";
import {
  CATEGORIES_SNAPSHOT_KEY,
  parseCategoriesSnapshot,
  type CategoriesSnapshot,
} from "../types/snapshot";

const loadAll = createSnapshotReader<CategoriesSnapshot, Category[]>({
  key: CATEGORIES_SNAPSHOT_KEY,
  label: "categories",
  parse: parseCategoriesSnapshot,
  select: (snapshot) => snapshot.categories,
  fallback: [],
});

/** R2状態をpage層の既存Result契約へ決定的に写像する。 */
export function mapCategoriesReadResult(
  result: SnapshotReadResult<Category[]>,
): Result<Category[], Error> {
  if (result.status === "ok" || result.status === "stale") return ok(result.data);
  if (result.status === "no-data") return ok([]);
  return err(new Error(`categories snapshot ${result.status}: ${result.error.message}`));
}

export async function readCategoriesFromR2(): Promise<Result<Category[], Error>> {
  try {
    return mapCategoriesReadResult(await loadAll.readResult());
  } catch (error) {
    logger.error({ error }, "readCategoriesFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function readCategoryByKeyFromR2(
  categoryKey: string,
): Promise<Result<Category | null, Error>> {
  try {
    const allResult = mapCategoriesReadResult(await loadAll.readResult());
    if (!allResult.success) return allResult;
    return ok(allResult.data.find((c) => c.categoryKey === categoryKey) ?? null);
  } catch (error) {
    logger.error({ error, categoryKey }, "readCategoryByKeyFromR2: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
