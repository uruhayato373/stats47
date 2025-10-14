/**
 * e-STATメタ情報バッチプロセッサー
 * 責務: 複数データの一括処理とレート制限
 */

import { EstatMetaInfoFetcher } from "./fetcher";
import { EstatIdUtils } from "./id-utils";
import { BatchProcessResult, BatchProcessOptions } from "./types";

export class EstatMetaInfoBatchProcessor {
  /**
   * 複数の統計表IDを一括処理
   *
   * @param statsDataIds - 統計表IDの配列
   * @param options - バッチ処理オプション
   * @returns バッチ処理結果
   */
  static async processBulk(
    statsDataIds: string[],
    options: BatchProcessOptions = {}
  ): Promise<BatchProcessResult> {
    const { batchSize = 10, delayMs = 1000, onProgress } = options;
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    console.log(
      `🔵 BatchProcessor: バッチ処理開始 - 総数: ${statsDataIds.length}`
    );

    // バッチ処理
    for (let i = 0; i < statsDataIds.length; i += batchSize) {
      const batch = statsDataIds.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(statsDataIds.length / batchSize);

      console.log(
        `🔵 BatchProcessor: バッチ ${batchNum}/${totalBatches} 処理中 (${batch.length}件)`
      );

      const batchResults = await Promise.allSettled(
        batch.map(async (id) => {
          const transformedData = await EstatMetaInfoFetcher.fetchAndTransform(
            id
          );
          return {
            statsDataId: id,
            success: true,
            entriesProcessed: transformedData.length,
          };
        })
      );

      // 結果を集約
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
          if (result.value.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } else {
          results.push({
            statsDataId: "unknown",
            success: false,
            entriesProcessed: 0,
            error: result.reason?.message || "Processing failed",
          });
          failureCount++;
        }
      }

      // 進捗報告
      if (onProgress) {
        onProgress(i + batch.length, statsDataIds.length);
      }

      // 次のバッチの前に待機（API制限対応）
      if (i + batchSize < statsDataIds.length && delayMs > 0) {
        console.log(`⏳ BatchProcessor: ${delayMs}ms 待機中...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log(
      `✅ BatchProcessor: バッチ処理完了 - 成功: ${successCount}, 失敗: ${failureCount}`
    );

    return {
      totalProcessed: statsDataIds.length,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * 統計表IDの範囲を指定して一括処理
   *
   * @param startId - 開始ID
   * @param endId - 終了ID
   * @param options - バッチ処理オプション
   * @returns バッチ処理結果
   */
  static async processRange(
    startId: string,
    endId: string,
    options?: BatchProcessOptions
  ): Promise<BatchProcessResult> {
    const statsDataIds = EstatIdUtils.generateIdRange(startId, endId);

    console.log(
      `🔵 BatchProcessor: 範囲処理 - ${startId} 〜 ${endId} (${statsDataIds.length}件)`
    );

    return this.processBulk(statsDataIds, options);
  }
}
