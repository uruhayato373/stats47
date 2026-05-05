import "server-only";

import { metricTexts, getDrizzle } from "@stats47/database/server";

export interface UpsertRankingAiContentInput {
  rankingKey: string;
  areaType: string;
  faq?: string | null;
  regionalAnalysis?: string | null;
  insights?: string | null;
  yearCode: string;
  aiModel: string;
  promptVersion: string;
  generatedAt: string;
  isActive?: boolean;
  isProofread?: boolean;
  proofreadAt?: string | null;
  editorialSource?: string;
  reviewedBy?: string | null;
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
      aiModel: data.aiModel,
      promptVersion: data.promptVersion,
      generatedAt: data.generatedAt,
      isActive: data.isActive ?? true,
      isProofread: data.isProofread ?? false,
      proofreadAt: data.proofreadAt ?? null,
      editorialSource: data.editorialSource ?? "ai-generated",
      reviewedBy: data.reviewedBy ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: metricTexts.metricKey,
      set: {
        faq: data.faq ?? null,
        regionalAnalysis: data.regionalAnalysis ?? null,
        insights: data.insights ?? null,
        yearCode: data.yearCode,
        aiModel: data.aiModel,
        promptVersion: data.promptVersion,
        generatedAt: data.generatedAt,
        isActive: data.isActive ?? true,
        updatedAt: now,
      },
    });
}
