import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";

import type { RankingValue } from "../../types";
import {
  rankingValuesKeyPath,
  type RankingValuesKeySnapshot,
} from "../../types/snapshot";

const STALE_AFTER_DAYS = 90;

const keyCache = new Map<string, RankingValuesKeySnapshot | null>();

function warnIfStale(generatedAt: string, rankingKey: string, areaType: string): void {
  const ageDays = (Date.now() - new Date(generatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > STALE_AFTER_DAYS) {
    logger.warn(
      { rankingKey, areaType, generatedAt, ageDays: Math.round(ageDays) },
      `ranking-values snapshot が ${STALE_AFTER_DAYS} 日以上古い`,
    );
  }
}

async function loadRankingValuesForKey(
  rankingKey: string,
  areaType: string,
): Promise<RankingValuesKeySnapshot | null> {
  const cacheKey = `${rankingKey}|${areaType}`;
  if (keyCache.has(cacheKey)) return keyCache.get(cacheKey) ?? null;

  const path = rankingValuesKeyPath(rankingKey, areaType);
  const snapshot = await fetchFromR2AsJson<RankingValuesKeySnapshot>(path);

  if (!snapshot) {
    logger.warn({ rankingKey, areaType, path }, "ranking-values snapshot が R2 に存在しません");
    keyCache.set(cacheKey, null);
    return null;
  }

  warnIfStale(snapshot.generatedAt, rankingKey, areaType);
  keyCache.set(cacheKey, snapshot);
  return snapshot;
}

/**
 * R2 snapshot から ranking_values を取得。
 *
 * - 1 fetch per (rankingKey, areaType) — yearCode は in-memory filter
 * - module-level cache により同一キーの複数年度アクセスは 1 R2 fetch で済む
 * - build 時 (NEXT_PHASE=phase-production-build) は ok([]) を返す
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
    const snapshot = await loadRankingValuesForKey(rankingKey, areaType);
    if (!snapshot) return ok([]);

    const partition = snapshot.partitions.find((p) => p.yearCode === yearCode);
    if (!partition) {
      logger.warn(
        { rankingKey, areaType, yearCode },
        "ranking-values: 指定 yearCode の partition が存在しません",
      );
      return ok([]);
    }

    return ok(partition.values);
  } catch (error) {
    logger.error(
      { rankingKey, areaType, yearCode, error: error instanceof Error ? error.message : String(error) },
      "readRankingValuesFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 指定都道府県の市区町村ランキング値を取得。
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
