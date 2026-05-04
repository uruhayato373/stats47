import "server-only";

import { aiContent, getDrizzle, indicators } from "@stats47/database/server";
import { and, eq } from "drizzle-orm";

import type { AiContentSnapshotRow } from "../types/snapshot";

/**
 * AI コンテンツを (rankingKey, areaType) で取得 (PR-5: 新 ai_content 経由)
 *
 * indicators をルックアップして indicator_id を取得し、新 ai_content から
 * SELECT する。出力 shape は AiContentSnapshotRow (R2 snapshot と同じ shape)。
 */
export async function findRankingAiContent(
  rankingKey: string,
  areaType: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<AiContentSnapshotRow | null> {
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb
    .select({
      rankingKey: indicators.key,
      areaType: indicators.areaType,
      faq: aiContent.faq,
      regionalAnalysis: aiContent.regionalAnalysis,
      insights: aiContent.insights,
      yearCode: aiContent.yearCode,
      aiModel: aiContent.aiModel,
      promptVersion: aiContent.promptVersion,
      generatedAt: aiContent.generatedAt,
      isActive: aiContent.isActive,
      isProofread: aiContent.isProofread,
      proofreadAt: aiContent.proofreadAt,
      editorialSource: aiContent.editorialSource,
      reviewedBy: aiContent.reviewedBy,
      createdAt: aiContent.createdAt,
      updatedAt: aiContent.updatedAt,
    })
    .from(aiContent)
    .innerJoin(indicators, eq(aiContent.indicatorId, indicators.id))
    .where(
      and(
        eq(indicators.key, rankingKey),
        eq(indicators.areaType, areaType as "prefecture" | "city" | "national" | "port" | "fishing_port")
      )
    )
    .limit(1);

  return rows[0] ?? null;
}
