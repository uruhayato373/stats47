import "server-only";

import { aiContent, getDrizzle, metrics } from "@stats47/database/server";
import { eq } from "drizzle-orm";

import type { AiContentSnapshotRow } from "../types/snapshot";

/**
 * AI コンテンツを rankingKey で取得 (metrics.area_type 削除後)
 *
 * metrics は key で一意のため areaType フィルタは不要。
 * areaType は AiContentSnapshotRow 互換のため "prefecture" で固定。
 */
export async function findRankingAiContent(
  rankingKey: string,
  _areaType?: string,
  db?: ReturnType<typeof getDrizzle>
): Promise<AiContentSnapshotRow | null> {
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb
    .select({
      rankingKey: metrics.key,
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
    .where(eq(metrics.key, rankingKey))
    .limit(1);

  if (!rows[0]) return null;
  return { ...rows[0], areaType: "prefecture" };
}
