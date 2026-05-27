import "server-only";

import { getDrizzle } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { readStatsValues } from "@stats47/stats-r2";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import type { RankingValue } from "../../types";

/**
 * 複数 metric の rank=1 行を R2 から一括取得 (FeaturedRankings 等)。
 * Phase 6 以降: D1 単発 SELECT ではなく metric 単位の R2 file を並列 fetch。
 */
export async function listTopRankingValuesBatch(
  items: { rankingKey: string; yearCode: string }[],
  areaType: AreaType,
  _db?: ReturnType<typeof getDrizzle>,
): Promise<Result<Map<string, RankingValue>, Error>> {
  try {
    if (items.length === 0) return ok(new Map());
    if (areaType === "national") return ok(new Map());

    const topMap = new Map<string, RankingValue>();
    await Promise.all(
      items.map(async ({ rankingKey, yearCode }) => {
        try {
          const payload = await readStatsValues(rankingKey, areaType);
          if (!payload) return;
          const topRow = payload.rows.find(
            (r) =>
              String(r.yearCode) === yearCode &&
              r.rank != null &&
              Number(r.rank) === 1,
          );
          if (topRow) {
            topMap.set(rankingKey, {
              areaType,
              areaCode: topRow.areaCode,
              areaName: topRow.areaName,
              yearCode: String(topRow.yearCode),
              yearName: topRow.yearName,
              metricKey: rankingKey,
              value: topRow.value !== null ? Number(topRow.value) : 0,
              unit: topRow.unit ?? "",
              rank: topRow.rank != null ? Number(topRow.rank) : 0,
            });
          }
        } catch (e) {
          logger.warn({ rankingKey, error: e }, "listTopRankingValuesBatch: per-key failure");
        }
      }),
    );

    return ok(topMap);
  } catch (error) {
    logger.error({ error, areaType }, "listTopRankingValuesBatch: failed");
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
