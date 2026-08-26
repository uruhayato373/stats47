import "server-only";

import { cache } from "react";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";

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

function parseRankingPageCards(value: unknown): RankingPageCard[] {
  if (!Array.isArray(value)) throw new Error("ranking page cards must be an array");
  return value.map((card, index) => {
    if (typeof card !== "object" || card === null || Array.isArray(card)) {
      throw new Error(`cards[${index}] must be an object`);
    }
    const row = card as Record<string, unknown>;
    for (const field of ["id", "rankingKey", "componentType"] as const) {
      if (typeof row[field] !== "string") throw new Error(`cards[${index}].${field} must be string`);
    }
    if (!Number.isFinite(row.displayOrder) || typeof row.isActive !== "boolean") {
      throw new Error(`cards[${index}] order/active fields are schema-invalid`);
    }
    for (const field of ["title", "componentProps", "createdAt", "updatedAt"] as const) {
      if (row[field] !== null && typeof row[field] !== "string") {
        throw new Error(`cards[${index}].${field} must be string or null`);
      }
    }
    return row as unknown as RankingPageCard;
  });
}

// React cache() でリクエストスコープ dedupe。旧実装は module-level Map で
// クロスリクエストにキャッシュしており、R2 push 後も warm isolate が stale を返し
// ISR 再生成を無効化しうる問題があった (.claude/rules/r2-storage-design.md: no module cache)。
export const readRankingPageCardsFromR2 = cache(
  async (rankingKey: string): Promise<RankingPageCard[]> => {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return [];
    }
    const result = await createSnapshotReader({
      key: rankingPageCardsKeyPath(rankingKey),
      label: `ranking-page-cards:${rankingKey}`,
      parse: parseRankingPageCards,
      select: (cards) => cards,
    }).readResult();
    if (result.status === "ok" || result.status === "stale") return result.data;
    if (result.status === "no-data") return [];
    logger.error({ rankingKey, status: result.status, error: result.error.message }, "readRankingPageCardsFromR2: failed");
    throw result.error;
  },
);
