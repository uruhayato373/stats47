import "server-only";

import { logger } from "@stats47/logger/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { err, ok, type Result } from "@stats47/types";
import type { AreaType } from "@stats47/types";

import type { RankingValue } from "../../types";
import {
  rankingNationalTrendPath,
  rankingNormalizedValuesKeyPath,
  rankingValuesKeyPath,
  type RankingNationalTrendSnapshot,
  type RankingValuesKeySnapshot,
} from "../../types/snapshot";
import {
  parseNationalTrendSnapshot,
  parseRankingValuesKeySnapshot,
} from "../schemas/ranking-values.schemas";

const STALE_AFTER_DAYS = 90;

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
  const path = rankingValuesKeyPath(rankingKey, areaType);
  const data = await fetchFromR2AsJson<unknown>(path);

  if (!data) {
    logger.warn({ rankingKey, areaType, path }, "ranking-values snapshot が R2 に存在しません");
    return null;
  }

  const snapshot = parseRankingValuesKeySnapshot(data);
  warnIfStale(snapshot.generatedAt, rankingKey, areaType);
  return snapshot;
}

/**
 * R2 snapshot から ranking_values を取得。
 *
 * - 1 fetch per (rankingKey, areaType) — yearCode は in-memory filter
 * - build 時 (NEXT_PHASE=phase-production-build) は ok([]) を返す
 *
 * ※ module-level cache は持たない (.claude/rules/r2-storage-design.md)。各 render は 1 (key,areaType)
 *   につき 1 回しか呼ばないため request 内 dedup は不要。旧 keyCache は warm isolate で R2 push 後の
 *   stale を招き、月次 data-refresh の観測値更新が反映されない問題があったため撤去。
 *   同一 render で同一 key を複数 component が読む場合に dedup したくなったら、app 層で React cache()
 *   ラップする (cachedFindRankingItem と同じパターン)。
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

    const normalizedYear = yearCode.slice(0, 4);
    const partition = snapshot.partitions.find((p) => p.yearCode.slice(0, 4) === normalizedYear);
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
 * 生 R2 snapshot から **全年度** の ranking_values を取得 (1 fetch)。
 *
 * - テーマダッシュボードが「current 年の values + 全年トレンド」を 1 read で得るために使う
 *   (都道府県指標を e-Stat ライブ取得しないための堅牢経路。`/ranking/*` と同一の R2 source)。
 * - build 時 (NEXT_PHASE=phase-production-build) は ok([]) を返す → 呼び出し側は force-dynamic で
 *   build prerender を避け、runtime (Worker) で R2 を読む。
 * - 都道府県 (47×全年) 用。市区町村 (1741×全年) は巨大なため単年 readRankingValuesFromR2 を使う。
 */
export async function readAllYearsRankingValuesFromR2(
  rankingKey: string,
  areaType: AreaType,
): Promise<Result<RankingValue[], Error>> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return ok([]);
  }

  try {
    const snapshot = await loadRankingValuesForKey(rankingKey, areaType);
    if (!snapshot) return ok([]);

    const all: RankingValue[] = [];
    for (const partition of snapshot.partitions) {
      all.push(...partition.values);
    }
    return ok(all);
  } catch (error) {
    logger.error(
      { rankingKey, areaType, error: error instanceof Error ? error.message : String(error) },
      "readAllYearsRankingValuesFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 正規化済み R2 snapshot から ranking_values を取得。
 *
 * normType: "per_population" → app/ranking/{key}/values-per-population.json
 * normType: "per_area"       → app/ranking/{key}/values-per-area.json
 *
 * ファイルが存在しない場合は ok([]) を返す（computeNormalization フォールバック用）。
 */
export async function readNormalizedRankingValuesFromR2(
  rankingKey: string,
  _areaType: AreaType,
  yearCode: string,
  normType: string,
): Promise<Result<RankingValue[], Error>> {
  try {
    const path = rankingNormalizedValuesKeyPath(rankingKey, normType);
    const data = await fetchFromR2AsJson<unknown>(path);
    if (!data) return ok([]);

    const snapshot = parseRankingValuesKeySnapshot(data);

    const normalizedYear = yearCode.slice(0, 4);
    const partition = snapshot.partitions.find((p) => p.yearCode.slice(0, 4) === normalizedYear);
    if (!partition) return ok([]);

    return ok(partition.values);
  } catch (error) {
    logger.error(
      { rankingKey, yearCode, normType, error: error instanceof Error ? error.message : String(error) },
      "readNormalizedRankingValuesFromR2: failed",
    );
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 正規化済み R2 snapshot から全年度の ranking_values を取得 (ダウンロード用)。
 *
 * ファイルが存在しない場合は ok([]) を返す。
 */
export async function readAllYearsNormalizedRankingValuesFromR2(
  rankingKey: string,
  _areaType: AreaType,
  normType: string,
): Promise<Result<RankingValue[], Error>> {
  try {
    const path = rankingNormalizedValuesKeyPath(rankingKey, normType);
    const data = await fetchFromR2AsJson<unknown>(path);
    if (!data) return ok([]);

    const snapshot = parseRankingValuesKeySnapshot(data);

    const all: RankingValue[] = [];
    for (const partition of snapshot.partitions) {
      all.push(...partition.values);
    }
    return ok(all);
  } catch (error) {
    logger.error(
      { rankingKey, normType, error: error instanceof Error ? error.message : String(error) },
      "readAllYearsNormalizedRankingValuesFromR2: failed",
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

/**
 * 全国時系列スナップショット (app/ranking/<key>/national-trend.json) を読む。
 *
 * 基準 (original / per_population / per_area) ごとの「全国平均の推移」を 1 fetch で返す。
 * writer: `packages/ranking/src/scripts/generate-ranking-normalized-values.ts`
 *
 * 未生成 / 破損時は null (UI 側は非表示にフォールバックする)。
 */
export async function readNationalTrendFromR2(
  rankingKey: string,
): Promise<RankingNationalTrendSnapshot | null> {
  try {
    const data = await fetchFromR2AsJson<unknown>(rankingNationalTrendPath(rankingKey));
    if (!data) return null;
    return parseNationalTrendSnapshot(data);
  } catch (error) {
    logger.error(
      { rankingKey, error: error instanceof Error ? error.message : String(error) },
      "readNationalTrendFromR2: failed",
    );
    return null;
  }
}
