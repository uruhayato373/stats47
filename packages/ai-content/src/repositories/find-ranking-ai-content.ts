import "server-only";

import { aiContent, getDrizzle, metrics } from "@stats47/database/server";
import { and, eq } from "drizzle-orm";

import type { AiContentSnapshotRow } from "../types/snapshot";

/**
 * AI コンテンツを (rankingKey, areaType) で取得 (PR-5: 新 ai_content 経由)
 *
 * metrics をルックアップして metric_id を取得し、新 ai_content から
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
      rankingKey: metrics.key,
      areaType: metrics.areaType,
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
    .innerJoin(metrics, eq(aiContent.metricId, metrics.id))
    .where(
      and(
        eq(metrics.key, rankingKey),
        eq(metrics.areaType, areaType as "prefecture" | "city" | "national" | "port" | "fishing_port")
      )
    )
    .limit(1);

  return rows[0] ?? null;
}
