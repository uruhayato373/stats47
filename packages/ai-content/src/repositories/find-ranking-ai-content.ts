import "server-only";

import { metricTexts, getDrizzle, metrics } from "@stats47/database/server";
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
      faq: metricTexts.faq,
      regionalAnalysis: metricTexts.regionalAnalysis,
      insights: metricTexts.insights,
      yearCode: metricTexts.yearCode,
      aiModel: metricTexts.aiModel,
      promptVersion: metricTexts.promptVersion,
      generatedAt: metricTexts.generatedAt,
      isActive: metricTexts.isActive,
      isProofread: metricTexts.isProofread,
      proofreadAt: metricTexts.proofreadAt,
      editorialSource: metricTexts.editorialSource,
      reviewedBy: metricTexts.reviewedBy,
      createdAt: metricTexts.createdAt,
      updatedAt: metricTexts.updatedAt,
    })
    .from(metricTexts)
    .innerJoin(metrics, eq(metricTexts.metricKey, metrics.key))
    .where(eq(metrics.key, rankingKey))
    .limit(1);

  if (!rows[0]) return null;
  return { ...rows[0], areaType: "prefecture" };
}
