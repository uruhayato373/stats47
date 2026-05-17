import "server-only";

import { metrics, getDrizzle } from "@stats47/database/server";
import { eq } from "drizzle-orm";

import type { AiContentSnapshotRow } from "../types/snapshot";

export async function findRankingAiContent(
  rankingKey: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<AiContentSnapshotRow | null> {
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb
    .select({
      rankingKey: metrics.key,
      yearCode: metrics.yearCode,
      faq: metrics.faq,
      regionalAnalysis: metrics.regionalAnalysis,
      insights: metrics.insights,
      prefectureCommentary: metrics.prefectureCommentary,
      createdAt: metrics.createdAt,
      updatedAt: metrics.updatedAt,
    })
    .from(metrics)
    .where(eq(metrics.key, rankingKey))
    .limit(1);

  const row = rows[0];
  if (!row || !row.yearCode) return null;
  return row as AiContentSnapshotRow;
}
