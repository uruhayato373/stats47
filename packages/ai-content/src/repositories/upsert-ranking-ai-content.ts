import "server-only";

import { metrics, getDrizzle } from "@stats47/database/server";
import { eq } from "drizzle-orm";

export interface UpsertRankingAiContentInput {
  rankingKey: string;
  faq?: string | null;
  regionalAnalysis?: string | null;
  insights?: string | null;
  prefectureCommentary?: string | null;
  yearCode: string;
}

export async function upsertRankingAiContent(
  data: UpsertRankingAiContentInput,
  db?: ReturnType<typeof getDrizzle>
): Promise<void> {
  const drizzleDb = db ?? getDrizzle();

  const now = new Date().toISOString();
  await drizzleDb
    .update(metrics)
    .set({
      faq: data.faq ?? null,
      regionalAnalysis: data.regionalAnalysis ?? null,
      insights: data.insights ?? null,
      prefectureCommentary: data.prefectureCommentary ?? null,
      yearCode: data.yearCode,
      updatedAt: now,
    })
    .where(eq(metrics.key, data.rankingKey));
}
