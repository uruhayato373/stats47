import "server-only";

import { areaProfiles, getDrizzle } from "@stats47/database/server";

/**
 * 全件削除（再計算・メンテナンス用）(PR-5)
 */
export async function deleteAllAreaProfileRankings(): Promise<void> {
  const db = getDrizzle();
  await db.delete(areaProfiles);
}
