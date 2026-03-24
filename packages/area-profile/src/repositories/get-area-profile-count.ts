import "server-only";

import { areaProfileRankings, getDrizzle } from "@stats47/database/server";
import { sql } from "drizzle-orm";

/**
 * テーブルの総レコード数を取得
 */
export async function getAreaProfileCount(): Promise<number> {
  const db = getDrizzle();
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(areaProfileRankings)
    .get();
  return result?.count ?? 0;
}
