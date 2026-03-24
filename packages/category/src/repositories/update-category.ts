import "server-only";

import { categories, getDrizzle } from "@stats47/database/server";
import { err, type Result } from "@stats47/types";
import { eq, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import type { Category } from "../types/category";
import { findCategoryByKey } from "./find-category-by-key";

type CategoryUpdateSet = {
  categoryKey?: string;
  categoryName?: string;
  icon?: string | null;
  displayOrder?: number | null;
  updatedAt: SQL<unknown>;
};

/**
 * カテゴリを更新
 */
export async function updateCategory(
  categoryKey: string,
  data: {
    categoryKey?: string;
    categoryName?: string;
    icon?: string | null;
    displayOrder?: number;
  },
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<Category | null, Error>> {
  try {
    const drizzleDb = db || getDrizzle();

    const updates: CategoryUpdateSet = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    if (data.categoryName !== undefined) updates.categoryName = data.categoryName;
    if (data.categoryKey !== undefined) updates.categoryKey = data.categoryKey;
    if (data.icon !== undefined) updates.icon = data.icon || null;
    if (data.displayOrder !== undefined) updates.displayOrder = data.displayOrder;

    await drizzleDb
      .update(categories)
      .set(updates)
      .where(eq(categories.categoryKey, categoryKey));

    const updatedKey =
      data.categoryKey !== undefined ? data.categoryKey : categoryKey;
    return findCategoryByKey(updatedKey, drizzleDb);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
