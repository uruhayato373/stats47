import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";

import type { RankingValue } from "../../types";
import {
  rankingValuesPartitionPath,
  type RankingValuesPartitionSnapshot,
} from "../../types/snapshot";

const STALE_AFTER_DAYS = 90;

function warnIfStale(
  generatedAt: string,
  rankingKey: string,
  areaType: string,
  yearCode: string,
): void {
  const ageDays =
    (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { rankingKey, areaType, yearCode, generatedAt, ageDays: Math.round(ageDays) },
      `ranking-values partition snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

/**
 * R2 上の partition snapshot から ranking_values を取得。
 *
 * listRankingValues (D1) のドロップイン代替 (Result 型シグネチャ一致)。
 *
 * - 1 ranking_key × area_type × year_code = 1 R2 fetch
 * - prefecture: ~13KB / fetch、city: ~550KB / fetch
 * - build 時 (NEXT_PHASE=phase-production-build) は ok([]) を返し ISR で初回 fetch
 *   (2,000 超のページ × 同時 fetch で build hang を防ぐ)
 */
export async function readRankingValuesFromR2(
  rankingKey: string,
  areaType: AreaType,
  yearCode: string,
): Promise<Result<RankingValue[], Error>> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return ok([]);
  }

  try {
    const path = rankingValuesPartitionPath(rankingKey, areaType, yearCode);
    const snapshot =
      await fetchFromR2AsJson<RankingValuesPartitionSnapshot>(path);

    if (!snapshot) {
      logger.warn(
        { rankingKey, areaType, yearCode, path },
        "ranking-values partition snapshot が R2 に存在しません。空配列を返します",
      );
      return ok([]);
    }

    warnIfStale(snapshot.generatedAt, rankingKey, areaType, yearCode);
    return ok(snapshot.values);
  } catch (error) {
    logger.error(
      {
        rankingKey,
        areaType,
        yearCode,
        error: error instanceof Error ? error.message : String(error),
      },
      "readRankingValuesFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 指定都道府県の市区町村ランキング値を partition snapshot から取得。
 *
 * `listRankingValuesByPrefecture` (D1) のドロップイン代替。
 * city partition から areaCode の先頭 2 桁が prefCode と一致する行をフィルタ。
 */
export async function readRankingValuesByPrefectureFromR2(
  rankingKey: string,
  yearCode: string,
  prefCode: string,
): Promise<Result<RankingValue[], Error>> {
  const result = await readRankingValuesFromR2(rankingKey, "city", yearCode);
  if (!result.success) return result;
  const prefPrefix = prefCode.slice(0, 2);
  return ok(result.data.filter((v) => v.areaCode.startsWith(prefPrefix)));
}
