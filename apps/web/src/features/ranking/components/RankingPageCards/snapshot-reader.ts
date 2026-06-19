import "server-only";

import { cache } from "react";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

export function rankingPageCardsKeyPath(rankingKey: string): string {
  return `app/ranking/${encodeURIComponent(rankingKey)}/page-cards.json`;
}

/**
 * R2 snapshot に保存される ranking page card 1 件分の構造。
 *
 * PR-7 で page_components + page_component_assignments への移行に伴い、
 * 旧 ranking_page_cards テーブル schema への依存を切り離して独立型として定義する。
 * snapshot 形式は完全互換 (フロント reader への影響なし)。
 */
interface RankingPageCard {
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

// React cache() でリクエストスコープ dedupe。旧実装は module-level Map で
// クロスリクエストにキャッシュしており、R2 push 後も warm isolate が stale を返し
// ISR 再生成を無効化しうる問題があった (.claude/rules/r2-storage-design.md: no module cache)。
export const readRankingPageCardsFromR2 = cache(
  async (rankingKey: string): Promise<RankingPageCard[]> => {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return [];
    }
    try {
      const data = await fetchFromR2AsJson<RankingPageCard[]>(rankingPageCardsKeyPath(rankingKey));
      return data ?? [];
    } catch (error) {
      logger.error(
        { rankingKey, error: error instanceof Error ? error.message : String(error) },
        "readRankingPageCardsFromR2: failed",
      );
      return [];
    }
  },
);
