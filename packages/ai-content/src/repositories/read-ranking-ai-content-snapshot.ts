import "server-only";

import { type RankingAiContentRow } from "@stats47/database/schema";
import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import {
  AI_CONTENT_SNAPSHOT_KEY,
  type AiContentSnapshot,
} from "../types/snapshot";

const STALE_AFTER_DAYS = 30;

let cached: Map<string, RankingAiContentRow> | null = null;

function compositeKey(rankingKey: string, areaType: string): string {
  return `${rankingKey}|${areaType}`;
}

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

async function loadIndex(): Promise<Map<string, RankingAiContentRow>> {
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
  const map = new Map<string, RankingAiContentRow>();
  for (const row of snapshot.rows) {
    map.set(compositeKey(row.rankingKey, row.areaType), row);
  }
  cached = map;
  return map;
}

/**
 * R2 上の ai-content snapshot から (rankingKey, areaType) で取得。
 *
 * findRankingAiContent (D1) のドロップイン代替。
 *
 * build 時 (NEXT_PHASE=phase-production-build) は null を返し、ISR で初回 fetch。
 * 1,943 行 (~5MB) を 1 fetch で全ページ供給するため、build worker でも 1 回の
 * R2 fetch + JSON.parse で済む。ただし、build hang 防止のため安全側で skip。
 */
export async function readRankingAiContentFromR2(
  rankingKey: string,
  areaType: string,
): Promise<RankingAiContentRow | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  try {
    const map = await loadIndex();
    return map.get(compositeKey(rankingKey, areaType)) ?? null;
  } catch (error) {
    logger.error(
      {
        rankingKey,
        areaType,
        error: error instanceof Error ? error.message : String(error),
      },
      "readRankingAiContentFromR2: failed",
    );
    return null;
  }
}
