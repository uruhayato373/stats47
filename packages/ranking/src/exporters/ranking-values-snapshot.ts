import "server-only";

import { getDrizzle, rankingData } from "@stats47/database/server";
import { logger } from "@stats47/logger/server";
import { saveToR2 } from "@stats47/r2-storage/server";
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

/**
 * ranking_data 全件を partition ごとに分割して R2 に保存する。
 *
 * - 1 partition = (rankingKey, areaType, yearCode) の組合せ = 1 ファイル
 * - 全 partition は約 33K (2026-04 時点)
 * - 並列度: PARALLELISM (default 24)。R2 rate limit を考慮しつつ高速化
 * - メモリは全行を 1 回ロード (~1GB) するためローカル CLI 用途を想定
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
    "ranking_values 全件取得を開始…",
  );

  const rows = options.rankingKeyFilter
    ? await drizzleDb
        .select()
        .from(rankingData)
        .where(eq(rankingData.categoryCode, options.rankingKeyFilter))
    : await drizzleDb.select().from(rankingData);

  logger.info({ rowCount: rows.length }, "ranking_data ロード完了。partition に分割中…");

  const groups = new Map<string, { pk: PartitionKey; values: RankingValue[] }>();

  for (const row of rows) {
    const r = row as unknown as Record<string, unknown>;
    const rankingKey = String(r.categoryCode ?? "");
    const areaType = String(r.areaType ?? "");
    const yearCode = String(r.yearCode ?? "");
    if (!rankingKey || !areaType || !yearCode) continue;

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

  logger.info(
    { partitionCount: groups.size },
    "partition 分割完了。R2 に並列書き込みを開始…",
  );

  let written = 0;
  let totalSizeBytes = 0;
  const partitionList = [...groups.values()];
  for (let i = 0; i < partitionList.length; i += parallelism) {
    const batch = partitionList.slice(i, i + parallelism);
    const sizes = await Promise.all(
      batch.map((g) => writePartition(g.pk, g.values)),
    );
    written += batch.length;
    totalSizeBytes += sizes.reduce((s, n) => s + n, 0);
    if (written % 200 === 0 || written === partitionList.length) {
      logger.info(
        { written, total: partitionList.length, totalSizeBytes },
        "ranking_values 書き込み進捗",
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  logger.info(
    {
      partitions: groups.size,
      rows: rows.length,
      totalSizeBytes,
      durationMs,
    },
    "ranking_values snapshot 全 partition を R2 に保存しました",
  );

  return {
    partitions: groups.size,
    rows: rows.length,
    totalSizeBytes,
    durationMs,
  };
}
