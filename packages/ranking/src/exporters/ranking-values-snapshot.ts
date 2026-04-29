import "server-only";

import { getDrizzle, rankingData } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
import { eq, sql } from "drizzle-orm";

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
}

interface PartitionKey {
  rankingKey: string;
  areaType: string;
  yearCode: string;
}

function pkString(p: PartitionKey): string {
  return `${p.rankingKey}|${p.areaType}|${p.yearCode}`;
}

async function writePartition(
  pk: PartitionKey,
  values: RankingValue[],
): Promise<number> {
  const snapshot: RankingValuesPartitionSnapshot = {
    generatedAt: new Date().toISOString(),
    rankingKey: pk.rankingKey,
    areaType: pk.areaType,
    yearCode: pk.yearCode,
    count: values.length,
    values,
  };
  const body = JSON.stringify(snapshot);
  const path = rankingValuesPartitionPath(pk.rankingKey, pk.areaType, pk.yearCode);
  const result = await saveToR2(path, body, {
    contentType: "application/json; charset=utf-8",
  });
  return result.size;
}

async function processRankingKey(
  drizzleDb: ReturnType<typeof getDrizzle>,
  rankingKey: string,
  parallelism: number,
): Promise<{ partitions: number; rows: number; sizeBytes: number }> {
  const rows = await drizzleDb
    .select()
    .from(rankingData)
    .where(eq(rankingData.categoryCode, rankingKey));

  const groups = new Map<string, { pk: PartitionKey; values: RankingValue[] }>();
  for (const row of rows) {
    const r = row as unknown as Record<string, unknown>;
    const areaType = String(r.areaType ?? "");
    const yearCode = String(r.yearCode ?? "");
    if (!areaType || !yearCode) continue;

    const pk: PartitionKey = { rankingKey, areaType, yearCode };
    const key = pkString(pk);
    let group = groups.get(key);
    if (!group) {
      group = { pk, values: [] };
      groups.set(key, group);
    }
    group.values.push({
      areaType: areaType as RankingValue["areaType"],
      areaCode: String(r.areaCode ?? ""),
      areaName: String(r.areaName ?? ""),
      yearCode,
      yearName: String(r.yearName ?? `${yearCode}年度`),
      categoryCode: rankingKey,
      categoryName: String(r.categoryName ?? ""),
      value: r.value !== null && r.value !== undefined ? Number(r.value) : 0,
      unit: String(r.unit ?? ""),
      rank: r.rank !== null && r.rank !== undefined ? Number(r.rank) : 0,
    });
  }

  let sizeBytes = 0;
  const partitionList = [...groups.values()];
  for (let i = 0; i < partitionList.length; i += parallelism) {
    const batch = partitionList.slice(i, i + parallelism);
    const sizes = await Promise.all(
      batch.map((g) => writePartition(g.pk, g.values)),
    );
    sizeBytes += sizes.reduce((s, n) => s + n, 0);
  }

  return { partitions: groups.size, rows: rows.length, sizeBytes };
}

/**
 * ranking_data 全件を partition ごとに分割して R2 に保存する。
 *
 * - 1 partition = (rankingKey, areaType, yearCode) の組合せ = 1 ファイル
 * - 全 partition は約 33K (2026-04 時点)
 * - メモリ制約: 全行 (~1GB) を 1 回でロードすると OOM する。ranking_key 毎にチャンク処理。
 * - 並列度: PARALLELISM (default 24) は 1 ranking_key 内の partition 並列度。
 *
 * @param options.parallelism partition 並列書き込み数 (default 24)
 * @param options.rankingKeyFilter 特定 ranking_key だけ更新したい場合 (差分書き出し用)
 */
export async function exportRankingValuesSnapshots(
  options: {
    db?: ReturnType<typeof getDrizzle>;
    parallelism?: number;
    rankingKeyFilter?: string;
  } = {},
): Promise<ExportRankingValuesSnapshotResult> {
  const startedAt = Date.now();
  const drizzleDb = options.db ?? getDrizzle();
  const parallelism = options.parallelism ?? 24;

  logger.info(
    { parallelism, rankingKeyFilter: options.rankingKeyFilter ?? "(all)" },
    "ranking_values export を開始…",
  );

  // 1. distinct ranking_key を取得 (チャンク単位)
  const rankingKeys = options.rankingKeyFilter
    ? [options.rankingKeyFilter]
    : (
        await drizzleDb
          .selectDistinct({ rk: rankingData.categoryCode })
          .from(rankingData)
      )
          .map((r) => r.rk)
          .filter((rk): rk is string => Boolean(rk));

  logger.info(
    { rankingKeyCount: rankingKeys.length },
    "対象 ranking_key 数を確定",
  );

  let totalPartitions = 0;
  let totalRows = 0;
  let totalSizeBytes = 0;

  for (let i = 0; i < rankingKeys.length; i++) {
    const rk = rankingKeys[i];
    try {
      const result = await processRankingKey(drizzleDb, rk, parallelism);
      totalPartitions += result.partitions;
      totalRows += result.rows;
      totalSizeBytes += result.sizeBytes;
    } catch (error) {
      logger.error(
        { rankingKey: rk, error: error instanceof Error ? error.message : String(error) },
        "ranking_key 処理失敗。スキップ",
      );
    }

    if ((i + 1) % 25 === 0 || i === rankingKeys.length - 1) {
      logger.info(
        {
          processed: i + 1,
          total: rankingKeys.length,
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
    { partitions: totalPartitions, rows: totalRows, totalSizeBytes, durationMs },
    "ranking_values snapshot 全 partition を R2 に保存しました",
  );

  return {
    partitions: totalPartitions,
    rows: totalRows,
    totalSizeBytes,
    durationMs,
  };
}

// suppress unused import warning when sql isn't referenced
void sql;
