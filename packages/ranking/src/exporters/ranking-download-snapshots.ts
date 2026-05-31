import "server-only";

import { listMetricKeysByEntity } from "@stats47/data-configs";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { isOk } from "@stats47/types";
import iconv from "iconv-lite";

import {
  listRankingValuesAllYears,
  readAllYearsNormalizedRankingValuesFromR2,
} from "../repositories/ranking-value";
import type { RankingValue } from "../types";
import { rankingDownloadKeyPath } from "../types/snapshot";
import { buildAllBasesCsv, buildSingleSeriesCsv } from "../utils/build-download-csv";

/**
 * ランキングデータの「ダウンロード用」CSV (UTF-8+BOM / Shift_JIS) と JSON を
 * 全年分・全 basis 分で事前生成し R2 に保存する (完全DBレス)。
 *
 * Route Handler `/api/ranking/[key]/download` はこの事前生成ファイルをそのまま stream する
 * (= Workers 側で CSV 生成も SJIS encode もしない。SJIS encode はこの Node/CI 側で行う)。
 *
 * 入力 (すべて R2 観測値 / git TS、永続 D1 なし):
 *  - original:    listRankingValuesAllYears(key, "prefecture")  ← app/stats/<key>/values.json
 *  - per_*:       readAllYearsNormalizedRankingValuesFromR2(key, "prefecture", normType)
 *                 ← app/ranking/<key>/values-<normType>.json (無ければその basis は skip)
 *  - key 一覧:    listMetricKeysByEntity("prefecture")  ← git TS registry
 *
 * 出力 (saveToR2 → .local/r2、R2 反映は diff-push-r2 が担当):
 *  - app/ranking/<key>/downloads/values.csv / values.sjis.csv / values.json
 *  - app/ranking/<key>/downloads/values-per-population.csv … (basis ごと)
 *  - app/ranking/<key>/downloads/values-all-bases.csv / .sjis.csv (basis が 2 以上のときのみ)
 *
 * 注: R2 書き込み (diff-push) は CI/クラウド専用。ローカルでは生成のみ。
 */

const NORM_TYPES = ["per_population", "per_area", "per_household"] as const;

const BASIS_LABELS: Record<string, string> = {
  original: "総数",
  per_population: "人口10万人あたり",
  per_area: "面積100km²あたり",
  per_household: "1世帯あたり",
};

interface BasisSeries {
  basisKey: string;
  basisLabel: string;
  values: RankingValue[];
}

export interface ExportRankingDownloadSnapshotsResult {
  metrics: number;
  files: number;
  totalSizeBytes: number;
  durationMs: number;
}

async function processMetric(
  metricKey: string,
): Promise<{ files: number; sizeBytes: number }> {
  const originalResult = await listRankingValuesAllYears(metricKey, "prefecture");
  const original = isOk(originalResult) ? originalResult.data : [];
  if (original.length === 0) return { files: 0, sizeBytes: 0 };

  const seriesList: BasisSeries[] = [
    { basisKey: "original", basisLabel: BASIS_LABELS.original, values: original },
  ];

  for (const normType of NORM_TYPES) {
    const normResult = await readAllYearsNormalizedRankingValuesFromR2(
      metricKey,
      "prefecture",
      normType,
    );
    const normValues = isOk(normResult) ? normResult.data : [];
    if (normValues.length === 0) continue;
    seriesList.push({
      basisKey: normType,
      basisLabel: BASIS_LABELS[normType] ?? normType,
      values: normValues,
    });
  }

  let files = 0;
  let sizeBytes = 0;

  // basis ごとに {csv-utf8, csv-sjis, json}
  for (const series of seriesList) {
    const csvUtf8 = buildSingleSeriesCsv(series.values);
    const jsonStr = JSON.stringify(series.values);

    const csvBytes = Buffer.from(csvUtf8, "utf8");
    const csvSjisBytes = iconv.encode(csvUtf8, "Shift_JIS");
    const jsonBytes = Buffer.from(jsonStr, "utf8");

    await Promise.all([
      saveToR2(rankingDownloadKeyPath(metricKey, series.basisKey, "csv", "utf8"), csvBytes, {
        contentType: "text/csv; charset=utf-8",
      }),
      saveToR2(rankingDownloadKeyPath(metricKey, series.basisKey, "csv", "sjis"), csvSjisBytes, {
        contentType: "text/csv; charset=Shift_JIS",
      }),
      saveToR2(rankingDownloadKeyPath(metricKey, series.basisKey, "json", "utf8"), jsonBytes, {
        contentType: "application/json; charset=utf-8",
      }),
    ]);

    files += 3;
    sizeBytes += csvBytes.byteLength + csvSjisBytes.byteLength + jsonBytes.byteLength;
  }

  // 全基準まとめて (basis が 2 以上のときのみ)
  if (seriesList.length > 1) {
    const allCsv = buildAllBasesCsv(seriesList);
    const allCsvBytes = Buffer.from(allCsv, "utf8");
    const allCsvSjisBytes = iconv.encode(allCsv, "Shift_JIS");

    await Promise.all([
      saveToR2(rankingDownloadKeyPath(metricKey, "all-bases", "csv", "utf8"), allCsvBytes, {
        contentType: "text/csv; charset=utf-8",
      }),
      saveToR2(rankingDownloadKeyPath(metricKey, "all-bases", "csv", "sjis"), allCsvSjisBytes, {
        contentType: "text/csv; charset=Shift_JIS",
      }),
    ]);

    files += 2;
    sizeBytes += allCsvBytes.byteLength + allCsvSjisBytes.byteLength;
  }

  return { files, sizeBytes };
}

export async function exportRankingDownloadSnapshots(
  options: { rankingKeyFilter?: string; parallelism?: number } = {},
): Promise<ExportRankingDownloadSnapshotsResult> {
  const startedAt = Date.now();
  const parallelism = options.parallelism ?? 4;
  const keys = options.rankingKeyFilter
    ? [options.rankingKeyFilter]
    : listMetricKeysByEntity("prefecture");

  logger.info({ metricCount: keys.length, parallelism }, "ranking-download export を開始…");

  let totalFiles = 0;
  let totalSizeBytes = 0;
  let processedMetrics = 0;

  for (let i = 0; i < keys.length; i += parallelism) {
    const batch = keys.slice(i, i + parallelism);
    const results = await Promise.all(
      batch.map(async (key) => {
        try {
          return await processMetric(key);
        } catch (error) {
          logger.error(
            { metricKey: key, error: error instanceof Error ? error.message : String(error) },
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

    if ((i + batch.length) % 100 === 0 || i + batch.length >= keys.length) {
      logger.info(
        {
          processed: i + batch.length,
          total: keys.length,
          files: totalFiles,
          mb: (totalSizeBytes / 1024 / 1024).toFixed(2),
        },
        "ranking-download 進捗",
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    { metrics: processedMetrics, files: totalFiles, totalSizeBytes, durationMs },
    "ranking-download snapshot を .local/r2 に書き出しました (R2 反映は diff-push-r2)",
  );

  return { metrics: processedMetrics, files: totalFiles, totalSizeBytes, durationMs };
}
