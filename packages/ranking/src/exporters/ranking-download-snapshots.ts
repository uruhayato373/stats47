import "server-only";

import { getDrizzle, metrics, statsPrefecture } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { eq } from "drizzle-orm";
import iconv from "iconv-lite";

import { WELL_KNOWN_DENOMINATORS } from "../services/compute-normalization";
import type { RankingValue } from "../types";
import { rankingDownloadKeyPath } from "../types/snapshot";
import { buildAllBasesCsv, buildSingleSeriesCsv } from "../utils/build-download-csv";
import { computeCalculatedValues } from "../utils/compute-calculated-values";
import { rankByValue } from "../utils/rank-by-value";

interface NormOption {
  type: string;
  label: string;
  unit: string;
  scaleFactor?: number;
  denominatorKey?: string;
}

interface CalcConfig {
  normalizationOptions?: NormOption[];
}

export interface ExportRankingDownloadSnapshotsResult {
  metrics: number;
  files: number;
  totalSizeBytes: number;
  durationMs: number;
}

function parseCalc(json: string | null): CalcConfig {
  if (!json) return {};
  try {
    return JSON.parse(json) as CalcConfig;
  } catch {
    return {};
  }
}

async function loadValues(
  db: ReturnType<typeof getDrizzle>,
  metricKey: string,
): Promise<RankingValue[]> {
  const rows = await db
    .select()
    .from(statsPrefecture)
    .where(eq(statsPrefecture.metricKey, metricKey));

  return rows.map((row) => ({
    areaType: "prefecture",
    areaCode: row.areaCode ?? "",
    areaName: row.areaName ?? "",
    yearCode: String(row.yearCode ?? "").slice(0, 4),
    yearName: row.yearName ?? "",
    metricKey,
    value: row.value != null ? Number(row.value) : 0,
    unit: row.unit ?? "",
    rank: row.rank != null ? Number(row.rank) : 0,
  }));
}

function computeNormalizedSeries(
  numerator: RankingValue[],
  denominator: RankingValue[],
  option: NormOption,
  metricKey: string,
): RankingValue[] {
  // 年度ごとに分子・分母をペアリングして計算
  const numByYear = new Map<string, RankingValue[]>();
  for (const v of numerator) {
    const arr = numByYear.get(v.yearCode) ?? [];
    arr.push(v);
    numByYear.set(v.yearCode, arr);
  }
  const denByYear = new Map<string, RankingValue[]>();
  for (const v of denominator) {
    const arr = denByYear.get(v.yearCode) ?? [];
    arr.push(v);
    denByYear.set(v.yearCode, arr);
  }
  const denYearsSorted = [...denByYear.keys()].sort();
  const denLatestYear = denYearsSorted[denYearsSorted.length - 1] ?? "";

  const out: RankingValue[] = [];
  for (const [yearCode, numValues] of numByYear) {
    const denValues = denByYear.get(yearCode) ?? denByYear.get(denLatestYear);
    if (!denValues) continue;
    const computed = computeCalculatedValues(numValues, denValues, {
      type: "ratio",
      metricKey,
      unit: option.unit,
      keyBy: "areaCode",
      scaleFactor: option.scaleFactor ?? 1,
    });
    const ranked = rankByValue(computed) as RankingValue[];
    out.push(...ranked);
  }
  return out;
}

async function processMetric(
  db: ReturnType<typeof getDrizzle>,
  metricKey: string,
  calc: CalcConfig,
  dryRun: boolean,
): Promise<{ files: number; sizeBytes: number }> {
  const original = await loadValues(db, metricKey);
  if (original.length === 0) return { files: 0, sizeBytes: 0 };

  const seriesList: { basisKey: string; basisLabel: string; values: RankingValue[] }[] =
    [{ basisKey: "original", basisLabel: "総数", values: original }];

  // 正規化系列を計算
  const options = calc.normalizationOptions ?? [];
  for (const option of options) {
    const denominatorKey =
      option.denominatorKey ?? WELL_KNOWN_DENOMINATORS[option.type]?.prefecture;
    if (!denominatorKey) continue;
    const denominator = await loadValues(db, denominatorKey);
    if (denominator.length === 0) continue;
    const normValues = computeNormalizedSeries(original, denominator, option, metricKey);
    if (normValues.length === 0) continue;
    seriesList.push({
      basisKey: option.type,
      basisLabel: option.label,
      values: normValues,
    });
  }

  let files = 0;
  let sizeBytes = 0;

  // 各 basis × {csv-utf8, csv-sjis, json}
  for (const series of seriesList) {
    const csvUtf8 = buildSingleSeriesCsv(series.values);
    const jsonStr = JSON.stringify(series.values, null, 2);

    const csvPath = rankingDownloadKeyPath(metricKey, series.basisKey, "csv", "utf8");
    const csvSjisPath = rankingDownloadKeyPath(metricKey, series.basisKey, "csv", "sjis");
    const jsonPath = rankingDownloadKeyPath(metricKey, series.basisKey, "json", "utf8");

    const csvBytes = Buffer.from(csvUtf8, "utf8");
    const csvSjisBytes = iconv.encode(csvUtf8, "Shift_JIS");
    const jsonBytes = Buffer.from(jsonStr, "utf8");

    if (!dryRun) {
      await Promise.all([
        saveToR2(csvPath, csvBytes, { contentType: "text/csv; charset=utf-8" }),
        saveToR2(csvSjisPath, csvSjisBytes, { contentType: "text/csv; charset=Shift_JIS" }),
        saveToR2(jsonPath, jsonBytes, { contentType: "application/json; charset=utf-8" }),
      ]);
    }

    files += 3;
    sizeBytes += csvBytes.byteLength + csvSjisBytes.byteLength + jsonBytes.byteLength;
  }

  // 全基準まとめて (2 つ以上ある場合のみ)
  if (seriesList.length > 1) {
    const allCsv = buildAllBasesCsv(seriesList);
    const allCsvBytes = Buffer.from(allCsv, "utf8");
    const allCsvSjisBytes = iconv.encode(allCsv, "Shift_JIS");
    const allCsvPath = rankingDownloadKeyPath(metricKey, "all-bases", "csv", "utf8");
    const allCsvSjisPath = rankingDownloadKeyPath(metricKey, "all-bases", "csv", "sjis");

    if (!dryRun) {
      await Promise.all([
        saveToR2(allCsvPath, allCsvBytes, { contentType: "text/csv; charset=utf-8" }),
        saveToR2(allCsvSjisPath, allCsvSjisBytes, {
          contentType: "text/csv; charset=Shift_JIS",
        }),
      ]);
    }

    files += 2;
    sizeBytes += allCsvBytes.byteLength + allCsvSjisBytes.byteLength;
  }

  return { files, sizeBytes };
}

/**
 * 全 metric について、ダウンロード用 CSV (UTF-8+BOM, Shift_JIS) と JSON を事前生成して R2 に保存する。
 *
 * 生成ファイル (basis 数 × フォーマット):
 *   app/ranking/{key}/downloads/values.csv          (総数 UTF-8)
 *   app/ranking/{key}/downloads/values.sjis.csv     (総数 Shift_JIS)
 *   app/ranking/{key}/downloads/values.json
 *   app/ranking/{key}/downloads/values-per-population.csv
 *   app/ranking/{key}/downloads/values-per-population.sjis.csv
 *   app/ranking/{key}/downloads/values-per-population.json
 *   ... (per_area, per_household も同様)
 *   app/ranking/{key}/downloads/values-all-bases.csv      (全基準横並び、2 以上の場合のみ)
 *   app/ranking/{key}/downloads/values-all-bases.sjis.csv
 *
 * Route Handler `/api/ranking/[key]/download` から直接 stream される前提。
 * クライアント側でのオンデマンド CSV 生成は不要になる。
 */
export async function exportRankingDownloadSnapshots(
  options: {
    db?: ReturnType<typeof getDrizzle>;
    parallelism?: number;
    rankingKeyFilter?: string;
    dryRun?: boolean;
  } = {},
): Promise<ExportRankingDownloadSnapshotsResult> {
  const startedAt = Date.now();
  const db = options.db ?? getDrizzle();
  const parallelism = options.parallelism ?? 4;
  const dryRun = options.dryRun ?? false;

  const rows = options.rankingKeyFilter
    ? await db
        .select({ key: metrics.key, calcJson: metrics.calculationConfigJson })
        .from(metrics)
        .where(eq(metrics.key, options.rankingKeyFilter))
    : await db
        .select({ key: metrics.key, calcJson: metrics.calculationConfigJson })
        .from(metrics);

  logger.info(
    { metricCount: rows.length, dryRun, parallelism },
    "ranking-download export を開始…",
  );

  let totalFiles = 0;
  let totalSizeBytes = 0;
  let processedMetrics = 0;

  for (let i = 0; i < rows.length; i += parallelism) {
    const batch = rows.slice(i, i + parallelism);
    const results = await Promise.all(
      batch.map(async ({ key, calcJson }) => {
        try {
          const calc = parseCalc(calcJson ?? null);
          return await processMetric(db, key, calc, dryRun);
        } catch (err) {
          logger.error(
            { metricKey: key, error: err instanceof Error ? err.message : String(err) },
            "ranking-download: metric 処理失敗。スキップ",
          );
          return { files: 0, sizeBytes: 0 };
        }
      }),
    );

    for (const r of results) {
      totalFiles += r.files;
      totalSizeBytes += r.sizeBytes;
      if (r.files > 0) processedMetrics++;
    }

    if ((i + batch.length) % 100 === 0 || i + batch.length >= rows.length) {
      logger.info(
        {
          processed: i + batch.length,
          total: rows.length,
          files: totalFiles,
          mb: (totalSizeBytes / 1024 / 1024).toFixed(2),
        },
        "ranking-download 進捗",
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    { metrics: processedMetrics, files: totalFiles, totalSizeBytes, durationMs, dryRun },
    "ranking-download snapshot を R2 に保存しました",
  );

  return { metrics: processedMetrics, files: totalFiles, totalSizeBytes, durationMs };
}
