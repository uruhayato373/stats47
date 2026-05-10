import "server-only";

import { getDrizzle, metrics, statsPrefecture } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { eq } from "drizzle-orm";

import { WELL_KNOWN_DENOMINATORS } from "../services/compute-normalization";
import type { RankingValue } from "../types";
import { rankingNormalizedValuesKeyPath, type RankingValuesKeySnapshot } from "../types/snapshot";
import { computeCalculatedValues } from "../utils/compute-calculated-values";
import { rankByValue } from "../utils/rank-by-value";

export interface ExportRankingNormalizedValuesSnapshotResult {
  files: number;
  skipped: number;
  durationMs: number;
}

interface NormOption {
  type: string;
  unit: string;
  scaleFactor?: number;
  denominatorKey?: string;
}

function parseNormalizationOptions(calcConfigJson: string | null): NormOption[] {
  if (!calcConfigJson) return [];
  try {
    const config = JSON.parse(calcConfigJson) as { normalizationOptions?: NormOption[] };
    return config.normalizationOptions ?? [];
  } catch {
    return [];
  }
}

async function loadValuesByYear(
  drizzleDb: ReturnType<typeof getDrizzle>,
  metricKey: string,
): Promise<Map<string, RankingValue[]>> {
  const rows = await drizzleDb
    .select()
    .from(statsPrefecture)
    .where(eq(statsPrefecture.metricKey, metricKey));

  const byYear = new Map<string, RankingValue[]>();
  for (const row of rows) {
    const yearCode = String(row.yearCode ?? "").slice(0, 4);
    if (!yearCode) continue;
    const arr = byYear.get(yearCode) ?? [];
    arr.push({
      areaType: "prefecture",
      areaCode: row.areaCode ?? "",
      areaName: row.areaName ?? "",
      yearCode,
      yearName: row.yearName ?? "",
      metricKey,
      value: row.value != null ? Number(row.value) : 0,
      unit: row.unit ?? "",
      rank: row.rank != null ? Number(row.rank) : 0,
    });
    byYear.set(yearCode, arr);
  }
  return byYear;
}

async function processNormalization(
  drizzleDb: ReturnType<typeof getDrizzle>,
  rankingKey: string,
  option: NormOption,
  dryRun: boolean,
): Promise<boolean> {
  const denominatorKey =
    option.denominatorKey ?? WELL_KNOWN_DENOMINATORS[option.type]?.["prefecture"];

  if (!denominatorKey) {
    logger.warn({ rankingKey, normType: option.type }, "分母キーを特定できません。スキップ");
    return false;
  }

  const [numeratorByYear, denominatorByYear] = await Promise.all([
    loadValuesByYear(drizzleDb, rankingKey),
    loadValuesByYear(drizzleDb, denominatorKey),
  ]);

  if (numeratorByYear.size === 0) return false;

  // 分母の最新年度（フォールバック用）
  const sortedDenomYears = [...denominatorByYear.keys()].sort();
  const denomLatestYear = sortedDenomYears[sortedDenomYears.length - 1] ?? "";

  const partitions: RankingValuesKeySnapshot["partitions"] = [];

  for (const [yearCode, numValues] of [...numeratorByYear.entries()].sort((a, b) =>
    b[0].localeCompare(a[0])
  )) {
    const denValues =
      denominatorByYear.get(yearCode) ?? denominatorByYear.get(denomLatestYear);
    if (!denValues || denValues.length === 0) continue;

    const computed = computeCalculatedValues(numValues, denValues, {
      type: "ratio",
      metricKey: rankingKey,
      unit: option.unit,
      keyBy: "areaCode",
      scaleFactor: option.scaleFactor ?? 1,
    });

    const ranked = rankByValue(computed) as RankingValue[];
    if (ranked.length === 0) continue;

    partitions.push({ yearCode, count: ranked.length, values: ranked });
  }

  if (partitions.length === 0) return false;

  const snapshot: RankingValuesKeySnapshot = {
    generatedAt: new Date().toISOString(),
    rankingKey,
    areaType: "prefecture",
    partitions,
  };

  if (!dryRun) {
    const path = rankingNormalizedValuesKeyPath(rankingKey, option.type);
    await saveToR2(path, JSON.stringify(snapshot), {
      contentType: "application/json; charset=utf-8",
    });
  }

  return true;
}

/**
 * normalizationOptions を持つ全 metrics に対して正規化済み values を R2 に保存する。
 *
 * 生成ファイル:
 *   app/ranking/{key}/values-per-population.json
 *   app/ranking/{key}/values-per-area.json
 */
export async function exportRankingNormalizedValuesSnapshots(
  options: {
    db?: ReturnType<typeof getDrizzle>;
    parallelism?: number;
    rankingKeyFilter?: string;
    normTypeFilter?: string;
    dryRun?: boolean;
  } = {},
): Promise<ExportRankingNormalizedValuesSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = options.db ?? getDrizzle();
  const parallelism = options.parallelism ?? 8;
  const dryRun = options.dryRun ?? false;

  // calculationConfigJson を持つ metrics を取得
  const metricsRows = options.rankingKeyFilter
    ? await drizzleDb
        .select({ key: metrics.key, calcJson: metrics.calculationConfigJson })
        .from(metrics)
        .where(eq(metrics.key, options.rankingKeyFilter))
    : await drizzleDb
        .select({ key: metrics.key, calcJson: metrics.calculationConfigJson })
        .from(metrics);

  // normalizationOptions を持つ metric のみ抽出
  const tasks: Array<{ rankingKey: string; option: NormOption }> = [];
  for (const row of metricsRows) {
    const opts = parseNormalizationOptions(row.calcJson ?? null);
    for (const opt of opts) {
      if (options.normTypeFilter && opt.type !== options.normTypeFilter) continue;
      tasks.push({ rankingKey: row.key, option: opt });
    }
  }

  logger.info(
    { taskCount: tasks.length, dryRun, parallelism },
    "ranking_normalized_values export を開始…",
  );

  let totalFiles = 0;
  let totalSkipped = 0;

  for (let i = 0; i < tasks.length; i += parallelism) {
    const batch = tasks.slice(i, i + parallelism);
    const results = await Promise.all(
      batch.map(async ({ rankingKey, option }) => {
        try {
          const saved = await processNormalization(drizzleDb, rankingKey, option, dryRun);
          return saved ? 1 : 0;
        } catch (error) {
          logger.error(
            { rankingKey, normType: option.type, error: error instanceof Error ? error.message : String(error) },
            "正規化スナップショット生成失敗。スキップ",
          );
          return 0;
        }
      }),
    );

    for (const r of results) {
      if (r === 1) totalFiles++;
      else totalSkipped++;
    }

    if ((i + batch.length) % 200 === 0 || i + batch.length >= tasks.length) {
      logger.info(
        { processed: i + batch.length, total: tasks.length, totalFiles, totalSkipped },
        "ranking_normalized_values 進捗",
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    { files: totalFiles, skipped: totalSkipped, durationMs, dryRun },
    "ranking_normalized_values snapshot を R2 に保存しました",
  );

  return { files: totalFiles, skipped: totalSkipped, durationMs };
}
