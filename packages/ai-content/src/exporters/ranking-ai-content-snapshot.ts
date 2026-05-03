import "server-only";

import { getDrizzle, rankingAiContent } from "@stats47/database/server";
import { saveJsonSnapshot } from "@stats47/r2-storage/server";

import {
  AI_CONTENT_SNAPSHOT_KEY,
  type AiContentSnapshot,
} from "../types/snapshot";

import type { JsonSnapshotResult } from "@stats47/r2-storage/server";

export type ExportRankingAiContentSnapshotResult = JsonSnapshotResult;

export async function exportRankingAiContentSnapshot(
  db?: ReturnType<typeof getDrizzle>,
): Promise<ExportRankingAiContentSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = db ?? getDrizzle();

  const rows = await drizzleDb.select().from(rankingAiContent);

  const snapshot: AiContentSnapshot = {
    generatedAt: new Date().toISOString(),
    count: rows.length,
    rows,
  };

  return saveJsonSnapshot({
    key: AI_CONTENT_SNAPSHOT_KEY,
    data: snapshot,
    count: rows.length,
    label: "ai_content",
    startedAt,
  });
}
