import "server-only";

import { categories, getDrizzle } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { eq } from "drizzle-orm";

import type { Category } from "../types/category";
import { convertCategoryFromDB } from "./convert-category-from-db";

/**
 * カテゴリキーでカテゴリを検索
 */
export async function findCategoryByKey(
  categoryKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Category | null, Error>> {
  try {
    const drizzleDb = db || getDrizzle();

    const result = await drizzleDb
      .select()
      .from(categories)
      .where(eq(categories.categoryKey, categoryKey))
      .limit(1);

    if (result.length === 0) return ok(null);

    return ok(convertCategoryFromDB(result[0]));
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
