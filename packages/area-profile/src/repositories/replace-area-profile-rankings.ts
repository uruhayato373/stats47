import "server-only";

import {
  areaProfileRankings,
  getDrizzle,
  type InsertAreaProfileRanking,
} from "@stats47/database/server";
import { eq } from "drizzle-orm";

/**
 * 指定地域の全データを削除後、新規 INSERT する（地域単位の完全置換）
 */
export async function replaceAreaProfileRankings(
  areaCode: string,
  rows: InsertAreaProfileRanking[]
): Promise<void> {
  const db = getDrizzle();

  await db
    .delete(areaProfileRankings)
    .where(eq(areaProfileRankings.areaCode, areaCode));

  const CHUNK_SIZE = 100;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await db.insert(areaProfileRankings).values(rows.slice(i, i + CHUNK_SIZE));
  }
}
