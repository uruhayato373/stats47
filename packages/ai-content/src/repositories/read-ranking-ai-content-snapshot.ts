import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { aiContentKeyPath, type AiContentSnapshotRow } from "../types/snapshot";

const cache = new Map<string, AiContentSnapshotRow | null>();

/**
 * R2 上の ai-content/{key}.json から取得。
 *
 * 旧: ai-content/all.json (全件) → module-level cache → key で lookup
 * 新: ai-content/{key}.json を 1 fetch → そのまま返す
 *
 * build 時 (NEXT_PHASE=phase-production-build) は null を返す。
 */
export async function readRankingAiContentFromR2(
  rankingKey: string,
  _areaType?: string,
): Promise<AiContentSnapshotRow | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  if (cache.has(rankingKey)) return cache.get(rankingKey) ?? null;

  try {
    const data = await fetchFromR2AsJson<AiContentSnapshotRow>(aiContentKeyPath(rankingKey));
    cache.set(rankingKey, data ?? null);
    return data ?? null;
  } catch (error) {
    logger.error(
      { rankingKey, error: error instanceof Error ? error.message : String(error) },
      "readRankingAiContentFromR2: failed",
    );
    return null;
  }
}
