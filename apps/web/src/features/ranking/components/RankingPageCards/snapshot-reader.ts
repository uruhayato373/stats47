import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

export function rankingPageCardsKeyPath(rankingKey: string): string {
  return `app/ranking/${encodeURIComponent(rankingKey)}/page-cards.json`;
}

/** @deprecated rankingPageCardsKeyPath を使用してください */
export const RANKING_PAGE_CARDS_SNAPSHOT_KEY = "app/ranking-page-cards/all.json";

/**
 * R2 snapshot に保存される ranking page card 1 件分の構造。
 *
 * PR-7 で page_components + page_component_assignments への移行に伴い、
 * 旧 ranking_page_cards テーブル schema への依存を切り離して独立型として定義する。
 * snapshot 形式は完全互換 (フロント reader への影響なし)。
 */
export interface RankingPageCard {
  id: string;
  rankingKey: string;
  componentType: string;
  title: string | null;
  componentProps: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RankingPageCardsSnapshot {
  generatedAt: string;
  /** key: rankingKey → RankingPageCard[] (displayOrder 昇順、isActive のみ) */
  byRankingKey: Record<string, RankingPageCard[]>;
}

const cache = new Map<string, RankingPageCard[]>();

export async function readRankingPageCardsFromR2(
  rankingKey: string,
): Promise<RankingPageCard[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }
  if (cache.has(rankingKey)) return cache.get(rankingKey)!;
  try {
    const data = await fetchFromR2AsJson<RankingPageCard[]>(rankingPageCardsKeyPath(rankingKey));
    const result = data ?? [];
    cache.set(rankingKey, result);
    return result;
  } catch (error) {
    logger.error(
      { rankingKey, error: error instanceof Error ? error.message : String(error) },
      "readRankingPageCardsFromR2: failed",
    );
    return [];
  }
}
