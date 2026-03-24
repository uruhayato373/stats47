import "server-only";

import { categories, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { err, ok, type Result } from "@stats47/types";
import { eq } from "drizzle-orm";

/**
 * カテゴリを削除
 */
export async function deleteCategory(
  categoryKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<Result<void, Error>> {
  try {
    const drizzleDb = db || getDrizzle();

    await drizzleDb
      .delete(categories)
      .where(eq(categories.categoryKey, categoryKey));

    return ok(undefined);
  } catch (error) {
    logger.error({ error, categoryKey }, "deleteCategory failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
