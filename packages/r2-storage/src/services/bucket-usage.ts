/**
 * R2バケット使用量統計サービス
 *
 * R2バケットの使用状況を取得・分析する機能を提供します。
 */

import { listFromR2WithSize } from "../lib";

import { logger } from "@stats47/logger";

import type {
    DirectoryStats,
    R2BucketUsage,
    RankingKeyStats,
} from "../types";

/**
 * R2バケットの使用状況を取得
 *
 * @param bucketName - バケット名
 * @returns バケット使用状況
 */
export async function getR2BucketUsage(
  bucketName: string
): Promise<R2BucketUsage> {
  logger.info(
    {
      service: "r2-storage-service",
      bucketName,
    },
    `R2バケット使用状況の取得を開始: ${bucketName}`
  );

  try {
    // 全体のオブジェクト一覧を取得（サイズ情報付き）
    const allObjects = await listFromR2WithSize();

    const totalObjects = allObjects.length;
    const totalSize = allObjects.reduce((sum: number, obj: { size: number }) => sum + obj.size, 0);
    const freeTierLimit = 10 * 1024 * 1024 * 1024; // 10GB
    const freeTierUsagePercentage = (totalSize / freeTierLimit) * 100;

    // ディレクトリごとに集計
    const directoryStatsMap = new Map<string, DirectoryStats>();
    const rankingKeyStatsMap = new Map<string, RankingKeyStats>();

    for (const obj of allObjects) {
      // ディレクトリ（プレフィックス）を抽出
      const parts = obj.key.split("/");
      const prefix = parts.length > 1 ? `${parts[0]}/` : "その他";

      // ディレクトリ統計を更新
      const stats = directoryStatsMap.get(prefix) || {
        prefix,
        objectCount: 0,
        totalSize: 0,
        percentage: 0,
      };
      stats.objectCount++;
      stats.totalSize += obj.size;
      directoryStatsMap.set(prefix, stats);

      // ランキングデータの詳細統計
      if (obj.key.startsWith("ranking/")) {
        // ranking/prefecture/item-code/yearCode/stats.json の形式
        const rankingParts = obj.key.split("/");
        if (rankingParts.length >= 3) {
          const areaType = rankingParts[1]; // prefecture, city, national
          const rankingKey = rankingParts[2]; // item-code
          const key = `${areaType}/${rankingKey}`;

          const keyStats = rankingKeyStatsMap.get(key) || {
            key,
            size: 0,
          };
          keyStats.size += obj.size;
          rankingKeyStatsMap.set(key, keyStats);
        }
      }
    }

    // パーセンテージを計算
    const directoryStats = Array.from(directoryStatsMap.values()).map(
      (stats) => ({
        ...stats,
        percentage: totalSize > 0 ? (stats.totalSize / totalSize) * 100 : 0,
      })
    );

    // ランキングキー統計をソート（容量の大きい順）
    const rankingKeyStats = Array.from(rankingKeyStatsMap.values())
      .sort((a, b) => b.size - a.size)
      .slice(0, 10); // Top 10

    logger.info(
      {
        service: "r2-storage-service",
        bucketName,
        totalObjects,
        totalSize,
        freeTierUsagePercentage: freeTierUsagePercentage.toFixed(1),
      },
      `R2バケット使用状況の取得完了: ${bucketName}`
    );

    return {
      bucketName,
      totalObjects,
      totalSize,
      freeTierUsagePercentage,
      directoryStats: directoryStats.sort((a, b) => b.totalSize - a.totalSize),
      rankingKeyStats,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);

    logger.error(
      {
        service: "r2-storage-service",
        bucketName,
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "R2バケット使用状況の取得に失敗しました"
    );

    throw new Error(
      `R2バケット使用状況の取得に失敗しました: ${errorMessage}`
    );
  }
}
