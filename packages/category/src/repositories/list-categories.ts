import "server-only";

import { categories, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { asc } from "drizzle-orm";

import type { Category } from "../types/category";
import { convertCategoryFromDB } from "./convert-category-from-db";

/**
 * 全カテゴリを取得（表示順序でソート）
 */
export async function listCategories(
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Category[], Error>> {
  try {
    const drizzleDb = db || getDrizzle();

    const result = await drizzleDb
      .select()
      .from(categories)
      .orderBy(asc(categories.displayOrder));

    return ok(result.map(convertCategoryFromDB));
  } catch (error) {
    logger.error({ error }, "listCategories failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
