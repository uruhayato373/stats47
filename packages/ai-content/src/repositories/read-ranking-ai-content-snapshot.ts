import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { aiContentKeyPath, type AiContentSnapshotRow } from "../types/snapshot";

/**
 * R2 上の ai-content/{key}.json から取得。
 *
 * 旧: ai-content/all.json (全件) → module-level cache → key で lookup
 * 新: ai-content/{key}.json を 1 fetch → そのまま返す
 *
 * build 時 (NEXT_PHASE=phase-production-build) は null を返す。
 *
 * ※ module-level cache は持たない (.claude/rules/r2-storage-design.md)。ranking ページ render で
 *   1 回しか読まないため request 内 dedup は不要。module cache は warm isolate で R2 push 後の
 *   stale を招く (ISR 再生成を無効化) ため撤去。
 */
export async function readRankingAiContentFromR2(
  rankingKey: string,
  _areaType?: string,
): Promise<AiContentSnapshotRow | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null;
  }

  try {
    const data = await fetchFromR2AsJson<AiContentSnapshotRow>(aiContentKeyPath(rankingKey));
    return data ?? null;
  } catch (error) {
    logger.error(
      { rankingKey, error: error instanceof Error ? error.message : String(error) },
      "readRankingAiContentFromR2: failed",
    );
    return null;
  }
}
