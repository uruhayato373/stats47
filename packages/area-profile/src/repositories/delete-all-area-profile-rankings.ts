import "server-only";

import { areaProfileRankings, getDrizzle } from "@stats47/database/server";

/**
 * 全件削除（再計算やメンテナンス用）
 */
export async function deleteAllAreaProfileRankings(): Promise<void> {
  const db = getDrizzle();
  await db.delete(areaProfileRankings);
}
