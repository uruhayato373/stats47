import "server-only";

import { metrics, getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { isNotNull } from "drizzle-orm";

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

  const snapshotRows = rows as AiContentSnapshotRow[];

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
