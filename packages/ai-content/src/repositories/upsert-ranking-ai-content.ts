import "server-only";

import { aiContent, getDrizzle, indicators } from "@stats47/database/server";
import { and, eq } from "drizzle-orm";

/**
 * AI コンテンツを UPSERT (PR-5: 新 ai_content 経由)
 *
 * 入力は旧 (rankingKey, areaType) ベース。indicators をルックアップして
 * indicator_id を取得し、新 ai_content (PK: indicator_id) に UPSERT する。
 */
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

  const indicatorRows = await drizzleDb
    .select({ id: indicators.id })
    .from(indicators)
    .where(
      and(
        eq(indicators.key, data.rankingKey),
        eq(indicators.areaType, data.areaType as "prefecture" | "city" | "national" | "port" | "fishing_port")
      )
    )
    .limit(1);

  const indicator = indicatorRows[0];
  if (!indicator) {
    throw new Error(
      `upsertRankingAiContent: indicator not found for (${data.rankingKey}, ${data.areaType})`
    );
  }

  const now = new Date().toISOString();
  await drizzleDb
    .insert(aiContent)
    .values({
      indicatorId: indicator.id,
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
      target: aiContent.indicatorId,
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
