import "server-only";

import { type RankingPageCard } from "@stats47/database/schema";
import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

export const RANKING_PAGE_CARDS_SNAPSHOT_KEY = "snapshots/ranking-page-cards/all.json";

const STALE_AFTER_DAYS = 30;

export interface RankingPageCardsSnapshot {
  generatedAt: string;
  /** key: rankingKey → RankingPageCard[] (displayOrder 昇順、isActive のみ) */
  byRankingKey: Record<string, RankingPageCard[]>;
}

let cached: RankingPageCardsSnapshot | null = null;

function warnIfStale(generatedAt: string): void {
  const ageDays =
    (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { generatedAt, ageDays: Math.round(ageDays) },
      `ranking-page-cards snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

async function loadSnapshot(): Promise<RankingPageCardsSnapshot> {
  if (cached) return cached;
  const snapshot = await fetchFromR2AsJson<RankingPageCardsSnapshot>(
    RANKING_PAGE_CARDS_SNAPSHOT_KEY,
  );
  if (!snapshot) {
    cached = { generatedAt: new Date(0).toISOString(), byRankingKey: {} };
    return cached;
  }
  warnIfStale(snapshot.generatedAt);
  cached = snapshot;
  return snapshot;
}

export async function readRankingPageCardsFromR2(
  rankingKey: string,
): Promise<RankingPageCard[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }
  try {
    const snapshot = await loadSnapshot();
    return snapshot.byRankingKey[rankingKey] ?? [];
  } catch (error) {
    logger.error(
      { rankingKey, error: error instanceof Error ? error.message : String(error) },
      "readRankingPageCardsFromR2: failed",
    );
    return [];
  }
}
