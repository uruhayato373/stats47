import "server-only";

import { getDrizzle, metrics, statsPrefecture } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { eq } from "drizzle-orm";

import type { RankingValue } from "../types";
import {
  rankingValuesKeyPath,
  type RankingValuesKeySnapshot,
} from "../types/snapshot";

export interface ExportRankingValuesSnapshotResult {
  files: number;
  rows: number;
  totalSizeBytes: number;
  durationMs: number;
}

interface PartitionData {
  yearCode: string;
  values: RankingValue[];
}

async function processIndicator(
  drizzleDb: ReturnType<typeof getDrizzle>,
  metricKey: string,
  dryRun: boolean,
): Promise<{ files: number; rows: number; sizeBytes: number }> {
  const rows = await drizzleDb
    .select()
    .from(statsPrefecture)
    .where(eq(statsPrefecture.metricKey, metricKey));

  if (rows.length === 0) return { files: 0, rows: 0, sizeBytes: 0 };

  const partitionMap = new Map<string, PartitionData>();
  for (const row of rows) {
    const yearCode = String(row.yearCode ?? "");
    if (!yearCode) continue;

    let partition = partitionMap.get(yearCode);
    if (!partition) {
      partition = { yearCode, values: [] };
      partitionMap.set(yearCode, partition);
    }
    partition.values.push({
      areaType: "prefecture" as RankingValue["areaType"],
      areaCode: row.areaCode,
      areaName: row.areaName,
      yearCode,
      yearName: row.yearName,
      metricKey,
      value: row.value !== null && row.value !== undefined ? Number(row.value) : 0,
      unit: row.unit,
      rank: row.rank !== null && row.rank !== undefined ? Number(row.rank) : 0,
    });
  }

  for (const partition of partitionMap.values()) {
    partition.values.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.areaCode < b.areaCode ? -1 : a.areaCode > b.areaCode ? 1 : 0;
    });
  }

  const snapshot: RankingValuesKeySnapshot = {
    generatedAt: new Date().toISOString(),
    rankingKey: metricKey,
    areaType: "prefecture",
    partitions: [...partitionMap.values()].map((p) => ({
      yearCode: p.yearCode,
      count: p.values.length,
      values: p.values,
    })),
  };
  const body = JSON.stringify(snapshot);

  if (!dryRun) {
    const path = rankingValuesKeyPath(metricKey, "prefecture");
    await saveToR2(path, body, { contentType: "application/json; charset=utf-8" });
  }

  return { files: 1, rows: rows.length, sizeBytes: Buffer.byteLength(body, "utf8") };
}

/**
 * statsPrefecture 全件を ranking_key 単位で 1 ファイルに集約して R2 に保存する。
 *
 * 旧: ranking-values/{key}/prefecture/{yearCode}.json × 30K
 * 新: ranking-values/{key}/prefecture.json × 2,151 (全年度を partitions 配列に統合)
 */
export async function exportRankingValuesSnapshots(
  options: {
    db?: ReturnType<typeof getDrizzle>;
    parallelism?: number;
    rankingKeyFilter?: string;
    dryRun?: boolean;
  } = {},
): Promise<ExportRankingValuesSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = options.db ?? getDrizzle();
  const parallelism = options.parallelism ?? 8;
  const dryRun = options.dryRun ?? false;

  const indicatorRows = options.rankingKeyFilter
    ? await drizzleDb
        .selectDistinct({ key: metrics.key })
        .from(metrics)
        .where(eq(metrics.key, options.rankingKeyFilter))
    : await drizzleDb.selectDistinct({ key: metrics.key }).from(metrics);

  logger.info(
    { indicatorCount: indicatorRows.length, dryRun, parallelism },
    "ranking_values export を開始…",
  );

  let totalFiles = 0;
  let totalRows = 0;
  let totalSizeBytes = 0;

  for (let i = 0; i < indicatorRows.length; i += parallelism) {
    const batch = indicatorRows.slice(i, i + parallelism);
    const results = await Promise.all(
      batch.map(async ({ key }) => {
        try {
          return await processIndicator(drizzleDb, key, dryRun);
        } catch (error) {
          logger.error(
            { indicatorKey: key, error: error instanceof Error ? error.message : String(error) },
            "indicator 処理失敗。スキップ",
          );
          return { files: 0, rows: 0, sizeBytes: 0 };
        }
      }),
    );

    for (const r of results) {
      totalFiles += r.files;
      totalRows += r.rows;
      totalSizeBytes += r.sizeBytes;
    }

    if ((i + batch.length) % 100 === 0 || i + batch.length >= indicatorRows.length) {
      logger.info(
        { processed: i + batch.length, total: indicatorRows.length, totalFiles, totalRows },
        "ranking_values 進捗",
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    { files: totalFiles, rows: totalRows, totalSizeBytes, durationMs, dryRun },
    "ranking_values snapshot を R2 に保存しました",
  );

  return { files: totalFiles, rows: totalRows, totalSizeBytes, durationMs };
}
