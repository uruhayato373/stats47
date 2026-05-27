import "server-only";

import { logger } from "@stats47/logger/server";
import { ok, type Result } from "@stats47/types";
import type { RankingValue } from "../../types";

/**
 * Phase 7 (2026-05-28): D1 stats_prefecture テーブル DROP に伴い no-op 化。
 *
 * 旧実装は on-demand キャッシュ書き込み (e-Stat API → stats_prefecture INSERT) を行っていたが、
 * Phase 6 以降は R2 (`app/stats/<metric>/values.json`) が値の SSOT であり、
 * 観測値の populate は `/page-data-batch` skill による build-time バッチに集約。
 *
 * 本関数は呼び出し interface 互換性のため残置 (fetchRankingValuesOnDemand の cacheRankingValues
 * から呼ばれる)。常に ok(0) を返し、warning log で「on-demand cache 無効」を通知する。
 */
export async function upsertRankingValues(
  rankingKey: string,
  areaType: string,
  yearCode: string,
  values: RankingValue[],
  _db?: unknown,
): Promise<Result<number, Error>> {
  if (values.length === 0) return ok(0);

  logger.warn(
    { rankingKey, areaType, yearCode, valueCount: values.length },
    "upsertRankingValues: no-op (Phase 7: D1 stats_* dropped). " +
      "観測値の populate は /page-data-batch を使うこと。on-demand キャッシュは廃止。",
  );

  return ok(0);
}
