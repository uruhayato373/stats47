import "server-only";

import { categories, getDrizzle } from "@stats47/database/server";
import { err, ok, type Result } from "@stats47/types";
import { sql } from "drizzle-orm";

import type { Category } from "../types/category";
import { findCategoryByKey } from "./find-category-by-key";

/**
 * カテゴリを作成
 */
export async function createCategory(
  data: {
    categoryKey: string;
    categoryName: string;
    icon?: string | null;
    displayOrder?: number;
  },
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Category, Error>> {
  try {
    const drizzleDb = db || getDrizzle();

    await drizzleDb.insert(categories).values({
      categoryKey: data.categoryKey,
      categoryName: data.categoryName,
      icon: data.icon || null,
      displayOrder: data.displayOrder || 0,
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    });

    const createdResult = await findCategoryByKey(data.categoryKey, drizzleDb);
    if (!createdResult.success) return createdResult;
    if (!createdResult.data) return err(new Error("作成されたカテゴリの取得に失敗しました"));

    return ok(createdResult.data);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
