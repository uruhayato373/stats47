import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";

import {
  type CorrelationByKeySnapshot,
  correlationByKeyPath,
} from "../types/snapshot";
import type { CorrelatedItem } from "./find-highly-correlated";

const STALE_AFTER_DAYS = 30;

function warnIfStale(generatedAt: string, key: string): void {
  const ageDays = (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { key, generatedAt, ageDays: Math.round(ageDays) },
      `correlation per-key snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

/**
 * R2 上の per-ranking-key snapshot から、対象キーの相関上位 N ペアを返す。
 *
 * findHighlyCorrelated (D1) のドロップイン代替。Web の CorrelationSection から呼ぶことで
 * D1 read を完全に消す。fetch 失敗時は ok([]) でフォールバック (UI 側で空表示)。
 *
 * Result 型を返すのは findHighlyCorrelated のシグネチャに合わせるため (差し替え簡素化)。
 */
export async function readHighlyCorrelatedFromR2(
  rankingKey: string,
  limit = 10,
): Promise<Result<CorrelatedItem[], Error>> {
  // build 時 (NEXT_PHASE=phase-production-build): 1,920 ranking_key 各々に R2 fetch すると
  // build が 30 分超 に伸びる。ここで空配列を返し、ISR (revalidate=86400) で初回リクエスト時に
  // 生 fetch する。CorrelationSection は空のとき非表示なので first request の品質低下のみ。
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return ok([]);
  }

  try {
    const path = correlationByKeyPath(rankingKey);
    const snapshot = await fetchFromR2AsJson<CorrelationByKeySnapshot>(path);

    if (!snapshot) {
      logger.warn(
        { rankingKey, path },
        "per-key correlation snapshot が R2 に存在しません。空配列を返します",
      );
      return ok([]);
    }

    warnIfStale(snapshot.generatedAt, path);
    return ok(snapshot.pairs.slice(0, limit));
  } catch (error) {
    logger.error(
      {
        rankingKey,
        error: error instanceof Error ? error.message : String(error),
      },
      "readHighlyCorrelatedFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
