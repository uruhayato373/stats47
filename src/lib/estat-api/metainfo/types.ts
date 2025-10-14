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
  batchSize?: number; // バッチサイズ（デフォルト: 10）
  delayMs?: number; // バッチ間の待機時間（デフォルト: 1000ms）
  onProgress?: (processed: number, total: number) => void; // 進捗コールバック
}
