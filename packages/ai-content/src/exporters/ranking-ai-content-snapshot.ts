import "server-only";

import { metricTexts, getDrizzle, metrics } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { eq } from "drizzle-orm";

import {
  AI_CONTENT_SNAPSHOT_KEY,
  type AiContentSnapshot,
  type AiContentSnapshotRow,
} from "../types/snapshot";

export interface ExportRankingAiContentSnapshotResult {
  key: string;
  count: number;
  sizeBytes: number;
  durationMs: number;
}

/**
 * ai_content + metrics を JOIN して旧 RankingAiContent shape の R2 snapshot を出す。
 *
 * R2 snapshot の rankingKey / areaType フィールドは frontend (read-ranking-ai-content-snapshot)
 * との後方互換性のため引き続き metrics から復元して出力する。
 */
export async function exportRankingAiContentSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportRankingAiContentSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const rawRows = await drizzleDb
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
    .innerJoin(metrics, eq(metricTexts.metricKey, metrics.key));

  const rows = rawRows.map((r) => ({ ...r, areaType: "prefecture" as const }));
  const snapshotRows: AiContentSnapshotRow[] = rows.map((r) => ({
    rankingKey: r.rankingKey,
    areaType: r.areaType,
    faq: r.faq,
    regionalAnalysis: r.regionalAnalysis,
    insights: r.insights,
    yearCode: r.yearCode,
    aiModel: r.aiModel,
    promptVersion: r.promptVersion,
    generatedAt: r.generatedAt,
    isActive: r.isActive,
    isProofread: r.isProofread,
    proofreadAt: r.proofreadAt,
    editorialSource: r.editorialSource,
    reviewedBy: r.reviewedBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  const snapshot: AiContentSnapshot = {
    generatedAt: new Date().toISOString(),
    count: snapshotRows.length,
    rows: snapshotRows,
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(AI_CONTENT_SNAPSHOT_KEY, body, {
    contentType: "application/json; charset=utf-8",
  });

  const durationMs = Date.now() - startedAt;
  logger.info(
    { key: result.key, count: snapshotRows.length, sizeBytes: result.size, durationMs },
    "ai_content snapshot を R2 に保存しました",
  );

  return {
    key: result.key,
    count: snapshotRows.length,
    sizeBytes: result.size,
    durationMs,
  };
}
