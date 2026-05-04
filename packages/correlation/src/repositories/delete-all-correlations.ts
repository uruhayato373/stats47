import "server-only";

import { correlations, getDrizzle } from "@stats47/database/server";

/**
 * 相関分析結果を全件削除する (PR-5: 新 correlations 対象)
 */
export async function deleteAllCorrelations(): Promise<void> {
  const db = getDrizzle();
  await db.delete(correlations);
}
