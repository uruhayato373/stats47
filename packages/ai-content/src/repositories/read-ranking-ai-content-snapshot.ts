import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import {
  AI_CONTENT_SNAPSHOT_KEY,
  type AiContentSnapshot,
  type AiContentSnapshotRow,
} from "../types/snapshot";

const STALE_AFTER_DAYS = 30;

let cached: Map<string, AiContentSnapshotRow> | null = null;

function warnIfStale(generatedAt: string): void {
  const ageDays =
    (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { generatedAt, ageDays: Math.round(ageDays) },
      `ai-content snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

async function loadIndex(): Promise<Map<string, AiContentSnapshotRow>> {
  if (cached) return cached;
  const snapshot = await fetchFromR2AsJson<AiContentSnapshot>(
    AI_CONTENT_SNAPSHOT_KEY,
  );
  if (!snapshot) {
    logger.warn(
      { key: AI_CONTENT_SNAPSHOT_KEY },
      "ai-content snapshot が R2 に存在しません。空 Map を返します",
    );
    cached = new Map();
    return cached;
  }
  warnIfStale(snapshot.generatedAt);
  const map = new Map<string, AiContentSnapshotRow>();
  for (const row of snapshot.rows) {
    map.set(row.rankingKey, row);
  }
  cached = map;
  return map;
}

export async function readRankingAiContentFromR2(
  rankingKey: string,
  _areaType?: string,
): Promise<AiContentSnapshotRow | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  try {
    const map = await loadIndex();
    return map.get(rankingKey) ?? null;
  } catch (error) {
    logger.error(
      { rankingKey, error: error instanceof Error ? error.message : String(error) },
      "readRankingAiContentFromR2: failed",
    );
    return null;
  }
}
