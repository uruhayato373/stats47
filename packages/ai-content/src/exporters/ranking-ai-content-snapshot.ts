import "server-only";

import { metrics, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { isNotNull } from "drizzle-orm";

import { aiContentKeyPath, type AiContentSnapshotRow } from "../types/snapshot";

export interface ExportRankingAiContentSnapshotResult {
  files: number;
  durationMs: number;
}

/**
 * metrics テーブルの AI コンテンツを ranking_key 単位で R2 に保存する。
 *
 * 旧: ai-content/all.json (全件一括)
 * 新: ai-content/{key}.json × ranking_key 数
 */
export async function exportRankingAiContentSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportRankingAiContentSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb
    .select({
      rankingKey: metrics.key,
      yearCode: metrics.yearCode,
      faq: metrics.faq,
      regionalAnalysis: metrics.regionalAnalysis,
      insights: metrics.insights,
      createdAt: metrics.createdAt,
      updatedAt: metrics.updatedAt,
    })
    .from(metrics)
    .where(isNotNull(metrics.yearCode));

  const CONCURRENCY = 16;
  let files = 0;

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY) as AiContentSnapshotRow[];
    await Promise.all(
      batch.map(async (row) => {
        const body = JSON.stringify(row);
        await saveToR2(aiContentKeyPath(row.rankingKey), body, {
          contentType: "application/json; charset=utf-8",
        });
        files++;
      }),
    );
  }

  const durationMs = Date.now() - startedAt;
  logger.info({ files, durationMs }, "ai_content snapshot を R2 に保存しました");
  return { files, durationMs };
}
