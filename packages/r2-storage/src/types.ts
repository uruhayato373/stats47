/**
 * R2ストレージ同期関連の型定義
 *
 * R2ストレージの同期、アップロード、バケット使用量統計などで使用される型定義を提供します。
 */

/**
 * 同期オプション
 */
export interface SyncOptions {
  dryRun?: boolean;
  prefixes?: string[];
  verbose?: boolean;
}

/**
 * 同期結果
 */
export interface SyncResult {
  success: boolean;
  totalObjects: number;
  syncedObjects: number;
  skippedObjects: number;
  failedObjects: number;
  errors: Array<{ key: string; error: string }>;
  message: string;
}

/**
 * アップロード結果
 */
export interface UploadResult {
  success: boolean;
  uploadedCount: number;
  errorCount: number;
  errors: Array<{ path: string; error: string }>;
  message: string;
}

/**
 * ディレクトリ統計情報
 */
export interface DirectoryStats {
  prefix: string;
  objectCount: number;
  totalSize: number;
  percentage: number;
}

/**
 * ランキングキー統計情報
 */
export interface RankingKeyStats {
  key: string;
  size: number;
}

/**
 * R2バケット使用状況
 */
export interface R2BucketUsage {
  bucketName: string;
  totalObjects: number;
  totalSize: number;
  freeTierUsagePercentage: number;
  directoryStats: DirectoryStats[];
  rankingKeyStats: RankingKeyStats[];
  fetchedAt: string;
}
