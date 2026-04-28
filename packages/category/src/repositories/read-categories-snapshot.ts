import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";

import { type Category } from "../types/category";
import {
  CATEGORIES_SNAPSHOT_KEY,
  type CategoriesSnapshot,
} from "../types/snapshot";

const STALE_AFTER_DAYS = 30;

let cached: { fetchedAt: number; categories: Category[] } | null = null;

function warnIfStale(generatedAt: string): void {
  const ageDays = (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { generatedAt, ageDays: Math.round(ageDays) },
      `categories snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

async function loadAll(): Promise<Category[]> {
  if (cached) return cached.categories;
  const snapshot = await fetchFromR2AsJson<CategoriesSnapshot>(
    CATEGORIES_SNAPSHOT_KEY,
  );
  if (!snapshot) {
    logger.warn(
      { key: CATEGORIES_SNAPSHOT_KEY },
      "categories snapshot が R2 に存在しません",
    );
    cached = { fetchedAt: Date.now(), categories: [] };
    return [];
  }
  warnIfStale(snapshot.generatedAt);
  cached = { fetchedAt: Date.now(), categories: snapshot.categories };
  return snapshot.categories;
}

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
