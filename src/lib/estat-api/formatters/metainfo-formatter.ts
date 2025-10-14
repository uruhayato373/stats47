import { estatAPI } from "../client";
import {
  EstatMetaInfoResponse,
  EstatMetaCategoryData,
  TransformedMetadataEntry,
} from "../types";
import {
  EstatMetaInfoFormatter as NewFormatter,
  EstatMetaInfoFetcher,
  EstatMetaInfoBatchProcessor,
  EstatIdUtils,
} from "./metainfo";

/**
 * @deprecated このクラスは非推奨です。以下の新しいクラスを使用してください:
 * - EstatMetaInfoFormatter: データ変換
 * - EstatMetaInfoFetcher: API通信
 * - EstatMetaInfoBatchProcessor: バッチ処理
 * - EstatIdUtils: ID操作
 *
 * 新しいクラスは src/lib/estat-api/formatters/metainfo/ からインポートできます。
 */
export class EstatMetaInfoFormatter {
  /**
   * メタ情報を取得・変換
   * @deprecated EstatMetaInfoFetcher.fetchAndTransform() を使用してください
   */
  static async getAndTransformMetaInfo(
    statsDataId: string
  ): Promise<TransformedMetadataEntry[]> {
    return EstatMetaInfoFetcher.fetchAndTransform(statsDataId);
  }

  /**
   * メタ情報をCSV形式に変換
   * @deprecated 新しい EstatMetaInfoFormatter.transformToCSVFormat() を使用してください
   */
  static transformToCSVFormat(
    metaInfo: EstatMetaInfoResponse
  ): TransformedMetadataEntry[] {
    return NewFormatter.transformToCSVFormat(metaInfo);
  }

  /**
   * 複数の統計データIDを一括変換
   * @deprecated EstatMetaInfoBatchProcessor.processBulk() を使用してください
   */
  static async transformBulkMetaInfo(
    statsDataIds: string[],
    options: {
      batchSize?: number;
      delayMs?: number;
    } = {}
  ): Promise<{
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    results: Array<{
      statsDataId: string;
      success: boolean;
      entriesProcessed: number;
      error?: string;
    }>;
  }> {
    return EstatMetaInfoBatchProcessor.processBulk(statsDataIds, options);
  }

  /**
   * 統計データIDの範囲を指定して一括変換
   * @deprecated EstatMetaInfoBatchProcessor.processRange() を使用してください
   */
  static async transformMetaInfoRange(
    startId: string,
    endId: string,
    options?: {
      batchSize?: number;
      delayMs?: number;
    }
  ): Promise<{
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    results: Array<{
      statsDataId: string;
      success: boolean;
      entriesProcessed: number;
      error?: string;
    }>;
  }> {
    return EstatMetaInfoBatchProcessor.processRange(startId, endId, options);
  }
}
