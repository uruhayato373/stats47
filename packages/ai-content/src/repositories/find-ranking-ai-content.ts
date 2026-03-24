import "server-only";

import {
  getDrizzle,
  rankingAiContent,
  type RankingAiContentRow,
} from "@stats47/database/server";
import { and, eq } from "drizzle-orm";

/**
 * ランキングAIコンテンツを rankingKey + areaType で取得
 */
export async function findRankingAiContent(
  rankingKey: string,
  areaType: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<RankingAiContentRow | null> {
  const drizzleDb = db ?? getDrizzle();
  const rows = await drizzleDb
    .select()
    .from(rankingAiContent)
    .where(
      and(
        eq(rankingAiContent.rankingKey, rankingKey),
        eq(rankingAiContent.areaType, areaType)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}
