import "server-only";

import {
  getDrizzle,
  rankingAiContent,
  type InsertRankingAiContent,
} from "@stats47/database/server";

/**
 * ランキングAIコンテンツを UPSERT
 */
export async function upsertRankingAiContent(
  data: InsertRankingAiContent,
  db?: ReturnType<typeof getDrizzle>
): Promise<void> {
  const drizzleDb = db ?? getDrizzle();
  await drizzleDb
    .insert(rankingAiContent)
    .values({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [rankingAiContent.rankingKey, rankingAiContent.areaType],
      set: {
        faq: data.faq,
        regionalAnalysis: data.regionalAnalysis,
        insights: data.insights,
        yearCode: data.yearCode,
        dataHash: data.dataHash,
        aiModel: data.aiModel,
        promptVersion: data.promptVersion,
        generatedAt: data.generatedAt,
        isActive: data.isActive,
        updatedAt: new Date().toISOString(),
      },
    });
}
