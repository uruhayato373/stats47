import "server-only";

import { getDrizzle, getAreaNameMap, metrics, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { formatYearName } from "@stats47/types";
import { eq } from "drizzle-orm";

import type { RankingValue } from "../types";
import {
  rankingValuesPartitionPath,
  type RankingValuesPartitionSnapshot,
} from "../types/snapshot";

export interface ExportRankingValuesSnapshotResult {
  partitions: number;
  rows: number;
  totalSizeBytes: number;
  durationMs: number;
  dryRunPartitions?: Array<{
    rankingKey: string;
    areaType: string;
    yearCode: string;
    body: string;
  }>;
}

interface PartitionKey {
  rankingKey: string;
  areaType: string;
  yearCode: string;
}

function pkString(p: PartitionKey): string {
  return `${p.rankingKey}|${p.areaType}|${p.yearCode}`;
}

async function processIndicator(
  drizzleDb: ReturnType<typeof getDrizzle>,
  indicator: { id: number; key: string; title: string; unit: string; yearFormat: "fiscal" | "calendar" | "plain" },
  parallelism: number,
  dryRun: boolean,
  dryRunSink?: ExportRankingValuesSnapshotResult["dryRunPartitions"],
): Promise<{ partitions: number; rows: number; sizeBytes: number }> {
  const rows = await drizzleDb
    .select()
    .from(observations)
    .where(eq(observations.metricId, indicator.id));

  if (rows.length === 0) return { partitions: 0, rows: 0, sizeBytes: 0 };

  // Determine area type from first row (all rows for one metric share the same area_type)
  const firstAreaType = rows[0].areaType as import("@stats47/types").AreaType;
  const areaNameMap = await getAreaNameMap(firstAreaType, drizzleDb);

  const groups = new Map<string, { pk: PartitionKey; values: RankingValue[] }>();
  for (const row of rows) {
    const areaType = row.areaType;
    const yearCode = String(row.yearCode ?? "");
    if (!areaType || !yearCode) continue;

    const pk: PartitionKey = { rankingKey: indicator.key, areaType, yearCode };
    const k = pkString(pk);
    let group = groups.get(k);
    if (!group) {
      group = { pk, values: [] };
      groups.set(k, group);
    }
    group.values.push({
      areaType: areaType as RankingValue["areaType"],
      areaCode: row.areaCode,
      areaName: areaNameMap.get(row.areaCode) ?? row.areaCode,
      yearCode,
      yearName: formatYearName(yearCode, indicator.yearFormat),
      categoryCode: indicator.key,
      categoryName: indicator.title,
      value: row.value !== null && row.value !== undefined ? Number(row.value) : 0,
      unit: indicator.unit,
      rank: row.rank !== null && row.rank !== undefined ? Number(row.rank) : 0,
    });
  }

  for (const g of groups.values()) {
    g.values.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.areaCode < b.areaCode ? -1 : a.areaCode > b.areaCode ? 1 : 0;
    });
  }

  let sizeBytes = 0;
  const partitionList = [...groups.values()];

  for (let i = 0; i < partitionList.length; i += parallelism) {
    const batch = partitionList.slice(i, i + parallelism);
    const sizes = await Promise.all(
      batch.map(async (g) => {
        const snapshot: RankingValuesPartitionSnapshot = {
          generatedAt: new Date().toISOString(),
          rankingKey: g.pk.rankingKey,
          areaType: g.pk.areaType,
          yearCode: g.pk.yearCode,
          count: g.values.length,
          values: g.values,
        };
        const body = JSON.stringify(snapshot);
        if (dryRun) {
          dryRunSink?.push({ ...g.pk, body });
          return Buffer.byteLength(body, "utf8");
        }
        const path = rankingValuesPartitionPath(g.pk.rankingKey, g.pk.areaType, g.pk.yearCode);
        const result = await saveToR2(path, body, {
          contentType: "application/json; charset=utf-8",
        });
        return result.size;
      }),
    );
    sizeBytes += sizes.reduce((s, n) => s + n, 0);
  }

  return { partitions: groups.size, rows: rows.length, sizeBytes };
}

/**
 * observations 全件を partition ごとに分割して R2 に保存する (PR-5)
 *
 * - 1 partition = (rankingKey, areaType, yearCode) の組合せ = 1 ファイル
 * - 並列度: PARALLELISM (default 24) は 1 indicator 内の partition 並列度
 * - dryRun=true の場合は R2 に書かず body を返す（diff 用）
 *
 * @param options.parallelism partition 並列書き込み数 (default 24)
 * @param options.rankingKeyFilter 特定 indicator key だけ更新したい場合 (差分書き出し用)
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
  const parallelism = options.parallelism ?? 24;
  const dryRun = options.dryRun ?? false;
  const dryRunSink = dryRun
    ? ([] as NonNullable<ExportRankingValuesSnapshotResult["dryRunPartitions"]>)
    : undefined;

  const indicatorRowsRaw = options.rankingKeyFilter
    ? await drizzleDb
        .select({
          id: metrics.id,
          key: metrics.key,
          title: metrics.title,
          unit: metrics.unit,
          yearFormat: metrics.yearFormat,
        })
        .from(metrics)
        .where(eq(metrics.key, options.rankingKeyFilter))
    : await drizzleDb
        .select({
          id: metrics.id,
          key: metrics.key,
          title: metrics.title,
          unit: metrics.unit,
          yearFormat: metrics.yearFormat,
        })
        .from(metrics);

  logger.info(
    { indicatorCount: indicatorRowsRaw.length, dryRun, parallelism },
    "ranking_values export を開始…",
  );

  let totalPartitions = 0;
  let totalRows = 0;
  let totalSizeBytes = 0;

  for (let i = 0; i < indicatorRowsRaw.length; i++) {
    const ind = indicatorRowsRaw[i];
    try {
      const result = await processIndicator(drizzleDb, {
        id: ind.id,
        key: ind.key,
        title: ind.title,
        unit: ind.unit,
        yearFormat: ind.yearFormat ?? "fiscal",
      }, parallelism, dryRun, dryRunSink);
      totalPartitions += result.partitions;
      totalRows += result.rows;
      totalSizeBytes += result.sizeBytes;
    } catch (error) {
      logger.error(
        {
          metricId: ind.id,
          indicatorKey: ind.key,
          error: error instanceof Error ? error.message : String(error),
        },
        "indicator 処理失敗。スキップ",
      );
    }

    if ((i + 1) % 100 === 0 || i === indicatorRowsRaw.length - 1) {
      logger.info(
        {
          processed: i + 1,
          total: indicatorRowsRaw.length,
          totalPartitions,
          totalRows,
          totalSizeBytes,
        },
        "ranking_values 進捗",
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    { partitions: totalPartitions, rows: totalRows, totalSizeBytes, durationMs, dryRun },
    "ranking_values snapshot を R2 に保存しました",
  );

  return {
    partitions: totalPartitions,
    rows: totalRows,
    totalSizeBytes,
    durationMs,
    dryRunPartitions: dryRunSink,
  };
}
