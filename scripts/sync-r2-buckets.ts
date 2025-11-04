/**
 * R2バケット間同期スクリプト
 * 
 * 2つのR2バケット間でオブジェクトを同期するコアサービス
 * 
 * 使用方法:
 *   import { syncR2Buckets } from './sync-r2-buckets';
 *   await syncR2Buckets(sourceConfig, targetConfig, prefixes, options);
 * 
 * 処理内容:
 *   1. ソースバケットから指定されたプレフィックスのオブジェクト一覧を取得
 *   2. 各オブジェクトをターゲットバケットにコピー
 *   3. メタデータ（Content-Type、カスタムメタデータ）も保持
 *   4. エラーハンドリングと進行状況のログ出力
 */

import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { R2S3Client, type R2S3Config } from "../src/infrastructure/storage/s3-client";

export interface SyncOptions {
  dryRun?: boolean;
  prefixes?: string[];
  verbose?: boolean;
}

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
 * R2バケット間でオブジェクトを同期
 */
export async function syncR2Buckets(
  sourceConfig: R2S3Config,
  targetConfig: R2S3Config,
  prefixes: string[] = [],
  options: SyncOptions = {}
): Promise<SyncResult> {
  const { dryRun = false, verbose = false } = options;

  const sourceClient = new R2S3Client(sourceConfig);
  const targetClient = new R2S3Client(targetConfig);

  const result: SyncResult = {
    success: true,
    totalObjects: 0,
    syncedObjects: 0,
    skippedObjects: 0,
    failedObjects: 0,
    errors: [],
    message: "",
  };

  console.log("=".repeat(60));
  console.log("R2バケット間同期を開始します");
  console.log("=".repeat(60));
  console.log(`ソースバケット: ${sourceConfig.bucketName}`);
  console.log(`ターゲットバケット: ${targetConfig.bucketName}`);
  console.log(`同期プレフィックス: ${prefixes.length > 0 ? prefixes.join(", ") : "全て"}`);
  console.log(`ドライラン: ${dryRun ? "はい" : "いいえ"}`);
  console.log("=".repeat(60));
  console.log();

  // プレフィックスが指定されていない場合は全オブジェクトを同期
  const syncPrefixes = prefixes.length > 0 ? prefixes : [""];

  try {
    for (const prefix of syncPrefixes) {
      if (verbose) {
        console.log(`プレフィックス "${prefix}" を処理中...`);
      }

      // ソースバケットからオブジェクト一覧を取得
      const objectKeys = await sourceClient.listObjects(prefix);
      result.totalObjects += objectKeys.length;

      if (objectKeys.length === 0) {
        if (verbose) {
          console.log(`  → オブジェクトが見つかりませんでした`);
        }
        continue;
      }

      console.log(`  → ${objectKeys.length}件のオブジェクトを検出`);

      // 各オブジェクトを同期
      for (let i = 0; i < objectKeys.length; i++) {
        const key = objectKeys[i];
        const progress = `[${i + 1}/${objectKeys.length}]`;

        try {
          if (dryRun) {
            if (verbose) {
              console.log(`${progress} [DRY-RUN] 同期予定: ${key}`);
            }
            result.syncedObjects++;
            continue;
          }

          // ソースバケットからオブジェクトを取得
          const sourceObject = await sourceClient.getObject(key);
          if (!sourceObject) {
            console.log(`${progress} ⏭️  スキップ: ${key} (オブジェクトが見つかりません)`);
            result.skippedObjects++;
            continue;
          }

          // ソースバケットのメタデータを取得
          const sourceClientS3 = new (await import("@aws-sdk/client-s3")).S3Client({
            region: "auto",
            endpoint: `https://${sourceConfig.accountId}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: sourceConfig.accessKeyId,
              secretAccessKey: sourceConfig.secretAccessKey,
            },
            forcePathStyle: true,
          });

          let contentType = "application/octet-stream";
          let metadata: Record<string, string> = {};

          try {
            const headCommand = new HeadObjectCommand({
              Bucket: sourceConfig.bucketName,
              Key: key,
            });
            const headResponse = await sourceClientS3.send(headCommand);
            contentType = headResponse.ContentType || contentType;
            metadata = headResponse.Metadata || {};
          } catch (error) {
            // メタデータ取得失敗は無視して続行
            if (verbose) {
              console.log(`  ⚠️  メタデータ取得エラー: ${key} (続行します)`);
            }
          }

          // ターゲットバケットに保存
          await targetClient.putObject(key, sourceObject, {
            contentType,
            metadata,
          });

          if (verbose) {
            console.log(`${progress} ✅ 同期完了: ${key}`);
          }
          result.syncedObjects++;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : JSON.stringify(error);
          
          console.error(`${progress} ❌ エラー: ${key}`);
          console.error(`    ${errorMessage}`);
          
          result.failedObjects++;
          result.errors.push({ key, error: errorMessage });
          result.success = false;
        }
      }

      console.log();
    }

    // 結果サマリー
    console.log("=".repeat(60));
    console.log("同期結果サマリー");
    console.log("=".repeat(60));
    console.log(`合計オブジェクト: ${result.totalObjects}件`);
    console.log(`同期成功: ${result.syncedObjects}件`);
    console.log(`スキップ: ${result.skippedObjects}件`);
    console.log(`失敗: ${result.failedObjects}件`);

    if (result.errors.length > 0) {
      console.log();
      console.log("エラー詳細:");
      result.errors.forEach(({ key, error }) => {
        console.log(`  - ${key}: ${error}`);
      });
    }

    console.log("=".repeat(60));

    result.message = `${result.syncedObjects}件のオブジェクトを同期しました`;
    if (result.failedObjects > 0) {
      result.message += `（${result.failedObjects}件のエラーあり）`;
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);

    console.error("❌ 同期処理で致命的なエラーが発生しました:");
    console.error(errorMessage);

    result.success = false;
    result.message = `同期処理でエラーが発生しました: ${errorMessage}`;
    result.errors.push({ key: "unknown", error: errorMessage });

    return result;
  }
}

