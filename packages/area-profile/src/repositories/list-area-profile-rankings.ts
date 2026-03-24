import "server-only";

import {
  areaProfileRankings,
  getDrizzle,
  type AreaProfileRanking,
} from "@stats47/database/server";
import { eq } from "drizzle-orm";

/**
 * 指定地域の生データ行を取得（admin管理画面用）
 */
export async function listAreaProfileRankings(
  areaCode: string
): Promise<AreaProfileRanking[]> {
  const db = getDrizzle();

  return db
    .select()
    .from(areaProfileRankings)
    .where(eq(areaProfileRankings.areaCode, areaCode))
    .orderBy(areaProfileRankings.type, areaProfileRankings.rank)
    .all();
}
