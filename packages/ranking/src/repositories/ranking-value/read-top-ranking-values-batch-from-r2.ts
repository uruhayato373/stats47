import "server-only";

import { logger } from "@stats47/logger/server";
import { err, isOk, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";

import type { RankingValue } from "../../types";
import { readRankingValuesFromR2 } from "./read-ranking-values-from-r2";

/**
 * R2 partition snapshot から複数ランキングの rank=1 を一括取得。
 *
 * listTopRankingValuesBatch (D1) のドロップイン代替。
 * 各 (rankingKey, yearCode) について 1 partition fetch + rank=1 抽出。
 *
 * 並列度は readRankingValuesFromR2 の Promise.all で吸収する。
 */
export async function readTopRankingValuesBatchFromR2(
  items: { rankingKey: string; yearCode: string }[],
  areaType: AreaType,
): Promise<Result<Map<string, RankingValue>, Error>> {
  try {
    if (items.length === 0) {
      return ok(new Map());
    }

    const results = await Promise.all(
      items.map(async (it) => {
        const r = await readRankingValuesFromR2(
          it.rankingKey,
          areaType,
          it.yearCode,
        );
        if (!isOk(r)) return null;
        const top = r.data.find((v) => v.rank === 1);
        return top ? ([it.rankingKey, top] as const) : null;
      }),
    );

    const map = new Map<string, RankingValue>();
    for (const entry of results) {
      if (entry) map.set(entry[0], entry[1]);
    }
    return ok(map);
  } catch (error) {
    logger.error(
      { areaType, error: error instanceof Error ? error.message : String(error) },
      "readTopRankingValuesBatchFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
