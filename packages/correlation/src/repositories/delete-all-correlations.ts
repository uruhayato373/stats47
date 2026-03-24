import "server-only";

import {
  correlationAnalysis,
  getDrizzle,
} from "@stats47/database/server";

/**
 * 相関分析結果を全件削除する（再計算用）
 */
export async function deleteAllCorrelations(): Promise<void> {
  const db = getDrizzle();
  await db.delete(correlationAnalysis);
}
