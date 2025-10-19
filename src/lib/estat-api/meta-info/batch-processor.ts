/**
 * e-STATメタ情報バッチプロセッサー
 * 責務: 複数データの一括処理とレート制限
 */

import { EstatMetaInfoFetcher } from "./fetcher";
import { EstatIdUtils } from "./id-utils";
import { ESTAT_API_CONFIG } from "../config";
import { EstatBatchProcessError } from "../errors";

/**
 * バッチ処理結果の型定義
 */
export interface BatchProcessResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    statsDataId: string;
    success: boolean;
    entriesProcessed: number;
    error?: string;
  }>;
}

/**
 * バッチ処理オプション
 */
export interface BatchProcessOptions {
  batchSize?: number; // バッチサイズ（デフォルト: ESTAT_API_CONFIG.BATCH_SIZE）
  delayMs?: number; // バッチ間の待機時間（デフォルト: ESTAT_API_CONFIG.BATCH_DELAY_MS）
  onProgress?: (processed: number, total: number) => void; // 進捗コールバック
}

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
    const {
      batchSize = ESTAT_API_CONFIG.BATCH_SIZE,
      delayMs = ESTAT_API_CONFIG.BATCH_DELAY_MS,
      onProgress,
    } = options;

    const results: Array<{
      statsDataId: string;
      success: boolean;
      entriesProcessed: number;
      error?: string;
    }> = [];
    let successCount = 0;
    let failureCount = 0;

    // バッチ処理
    for (let i = 0; i < statsDataIds.length; i += batchSize) {
      const batch = statsDataIds.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(statsDataIds.length / batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (id) => {
          try {
            const transformedData =
              await EstatMetaInfoFetcher.fetchAndTransform(id);
            return {
              statsDataId: id,
              success: true,
              entriesProcessed: transformedData.length,
            };
          } catch (error) {
            return {
              statsDataId: id,
              success: false,
              entriesProcessed: 0,
              error:
                error instanceof Error ? error.message : "Processing failed",
            };
          }
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
          // この分岐は不要になる（try-catchで全てハンドリング）
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
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

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
    return this.processBulk(statsDataIds, options);
  }
}
