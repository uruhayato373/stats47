import "server-only";

import { metricTexts, getDrizzle } from "@stats47/database/server";

export interface UpsertRankingAiContentInput {
  rankingKey: string;
  faq?: string | null;
  regionalAnalysis?: string | null;
  insights?: string | null;
  yearCode: string;
}

export async function upsertRankingAiContent(
  data: UpsertRankingAiContentInput,
  db?: ReturnType<typeof getDrizzle>
): Promise<void> {
  const drizzleDb = db ?? getDrizzle();

  const now = new Date().toISOString();
  await drizzleDb
    .insert(metricTexts)
    .values({
      metricKey: data.rankingKey,
      faq: data.faq ?? null,
      regionalAnalysis: data.regionalAnalysis ?? null,
      insights: data.insights ?? null,
      yearCode: data.yearCode,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: metricTexts.metricKey,
      set: {
        faq: data.faq ?? null,
        regionalAnalysis: data.regionalAnalysis ?? null,
        insights: data.insights ?? null,
        yearCode: data.yearCode,
        updatedAt: now,
      },
    });
}
