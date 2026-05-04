import "server-only";

import { getDrizzle, indicators, observations } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { eq } from "drizzle-orm";

import type { RankingValue } from "../types";
import {
  rankingValuesPartitionPath,
  type RankingValuesPartitionSnapshot,
} from "../types/snapshot";

export interface ExportRankingValuesFromObservationsResult {
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
  indicator: { id: number; key: string },
  parallelism: number,
  dryRun: boolean,
  dryRunSink?: ExportRankingValuesFromObservationsResult["dryRunPartitions"],
): Promise<{ partitions: number; rows: number; sizeBytes: number }> {
  const rows = await drizzleDb
    .select()
    .from(observations)
    .where(eq(observations.indicatorId, indicator.id));

  const groups = new Map<string, { pk: PartitionKey; values: RankingValue[] }>();
  for (const row of rows) {
    const r = row as unknown as Record<string, unknown>;
    const areaType = String(r.entityType ?? "");
    const yearCode = String(r.yearCode ?? "");
    if (!areaType || !yearCode) continue;

    const pk: PartitionKey = { rankingKey: indicator.key, areaType, yearCode };
    const k = pkString(pk);
    let group = groups.get(k);
    if (!group) {
      group = { pk, values: [] };
      groups.set(k, group);
    }
    const valueNumeric = r.valueNumeric;
    group.values.push({
      areaType: areaType as RankingValue["areaType"],
      areaCode: String(r.entityCode ?? ""),
      areaName: String(r.entityName ?? ""),
      yearCode,
      yearName: String(r.yearName ?? `${yearCode}年度`),
      categoryCode: indicator.key,
      categoryName: String(r.categoryName ?? ""),
      value: valueNumeric !== null && valueNumeric !== undefined ? Number(valueNumeric) : 0,
      unit: String(r.unit ?? ""),
      rank: r.rank !== null && r.rank !== undefined ? Number(r.rank) : 0,
    });
  }

  // 値リストは旧 exporter と同じ順序（rank 昇順 → areaCode）にする
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
 * observations 全件を partition ごとに分割して R2 に保存する (PR-4)
 *
 * - データソース: observations (旧 ranking_data の置換)
 * - 出力形式: snapshots/ranking-values/{key}/{areaType}/{year}.json (既存と互換)
 * - 並列度: PARALLELISM (default 24)
 * - dryRun=true の場合は R2 に書かず body を返す（diff 用）
 */
export async function exportRankingValuesFromObservationsSnapshot(
  options: {
    db?: ReturnType<typeof getDrizzle>;
    parallelism?: number;
    indicatorKeyFilter?: string;
    dryRun?: boolean;
  } = {},
): Promise<ExportRankingValuesFromObservationsResult> {
  const startedAt = Date.now();
  const drizzleDb = options.db ?? getDrizzle();
  const parallelism = options.parallelism ?? 24;
  const dryRun = options.dryRun ?? false;
  const dryRunSink = dryRun
    ? ([] as NonNullable<ExportRankingValuesFromObservationsResult["dryRunPartitions"]>)
    : undefined;

  // 1. 対象 indicator を取得 (key で検索可能なように key と id を一緒に)
  const indicatorRowsRaw = options.indicatorKeyFilter
    ? await drizzleDb
        .select({ id: indicators.id, key: indicators.key })
        .from(indicators)
        .where(eq(indicators.key, options.indicatorKeyFilter))
    : await drizzleDb
        .select({ id: indicators.id, key: indicators.key })
        .from(indicators);

  logger.info(
    { indicatorCount: indicatorRowsRaw.length, dryRun, parallelism },
    "ranking_values from observations export を開始…",
  );

  let totalPartitions = 0;
  let totalRows = 0;
  let totalSizeBytes = 0;

  for (let i = 0; i < indicatorRowsRaw.length; i++) {
    const ind = indicatorRowsRaw[i];
    try {
      const result = await processIndicator(drizzleDb, ind, parallelism, dryRun, dryRunSink);
      totalPartitions += result.partitions;
      totalRows += result.rows;
      totalSizeBytes += result.sizeBytes;
    } catch (error) {
      logger.error(
        {
          indicatorId: ind.id,
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
        "observations 進捗",
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    { partitions: totalPartitions, rows: totalRows, totalSizeBytes, durationMs, dryRun },
    "ranking_values snapshot (from observations) 完了",
  );

  return {
    partitions: totalPartitions,
    rows: totalRows,
    totalSizeBytes,
    durationMs,
    dryRunPartitions: dryRunSink,
  };
}
