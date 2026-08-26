import "server-only";

import { logger } from "@stats47/logger/server";
import { createSnapshotReader } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";

import {
  type CorrelatedItem,
  type CorrelationByKeySnapshot,
  correlationByKeyPath,
  parseCorrelationByKeySnapshot,
} from "../types/snapshot";

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
    const result = await createSnapshotReader<CorrelationByKeySnapshot, CorrelationByKeySnapshot>({
      key: path,
      label: `correlation-by-key:${rankingKey}`,
      parse: parseCorrelationByKeySnapshot,
      select: (value) => value,
    }).readResult();

    if (result.status === "no-data") {
      logger.warn(
        { rankingKey, path },
        "per-key correlation snapshot が R2 に存在しません。空配列を返します",
      );
      return ok([]);
    }
    if (result.status === "source-unavailable" || result.status === "schema-invalid") {
      return err(result.error);
    }
    return ok(result.data.pairs.slice(0, limit));
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
