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
import type { CorrelationGroups } from "../selection-policy";

/**
 * 台帳に従って生成・検証された正負別の相関一覧を R2 から返す。
 * 未生成なら空の組、取得・形式エラーなら err を返す。
 */
export async function readHighlyCorrelatedFromR2(
  rankingKey: string,
): Promise<Result<CorrelationGroups<CorrelatedItem>, Error>> {
  // build 時の全指標 fetch を避け、ISR の初回リクエスト時に取得する。
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return ok({ positive: [], negative: [] });
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
        "per-key correlation snapshot が R2 に存在しません。空の組を返します",
      );
      return ok({ positive: [], negative: [] });
    }
    if (result.status === "source-unavailable" || result.status === "schema-invalid") {
      return err(result.error);
    }
    if (result.data.rankingKey !== rankingKey) return err(new Error('correlation rankingKey mismatch'));
    return ok(result.data.groups);
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
