
import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { logger } from "@stats47/logger";
import { createS3Client } from "../clients/create-s3-client";
import { getR2Client } from "../clients/get-r2-client";
import { detectEnvironment } from "../utils/detect-environment";
import { listFromR2 } from "./list";

/**
 * オブジェクトを R2 から削除
 *
 * @param key - オブジェクトキー
 * @param options - オプション
 */
export async function deleteFromR2(
  key: string,
  options?: { async?: boolean }
): Promise<void> {
  const env = detectEnvironment();

  // 1. S3互換APIが使用可能な場合
  if (env.hasS3Credentials) {
    try {
      const client = createS3Client();
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
      
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await client.send(command);
      return;
    } catch (error) {
      logger.error({ key, error }, "S3互換APIでの削除に失敗、R2バインディングにフォールバックを試行します");
    }
  }

  // 2. R2バインディングを使用
  const client = await getR2Client(options);
  await client.delete(key);
}

/**
 * 複数のオブジェクトを R2 から一括削除（最大1000件）
 *
 * @param keys - オブジェクトキーの配列（最大1000件）
 * @param options - オプション
 * @returns 削除されたキーの配列とエラーの配列
 */
export async function deleteMultipleFromR2(
  keys: string[],
  options?: { async?: boolean }
): Promise<{
  deleted: string[];
  errors: Array<{ key: string; code: string; message: string }>;
}> {
  if (keys.length === 0) {
    return { deleted: [], errors: [] };
  }

  const env = detectEnvironment();
  const deleted: string[] = [];
  const errors: Array<{ key: string; code: string; message: string }> = [];

  // 1. S3互換APIが使用可能な場合（一括削除が可能）
  if (env.hasS3Credentials) {
    try {
      const client = createS3Client();
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

      // 最大1000件の制限があるため、分割して処理（呼び出し側で通常制御されるが念のため）
      const chunkSize = 1000;
      for (let i = 0; i < keys.length; i += chunkSize) {
        const chunk = keys.slice(i, i + chunkSize);
        
        try {
          const command = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: chunk.map((key) => ({ Key: key })),
              Quiet: false,
            },
          });

          const response = await client.send(command);
          
          if (response.Deleted) {
            deleted.push(...response.Deleted.map((d) => d.Key || "").filter(Boolean));
          }
          
          if (response.Errors) {
            errors.push(
              ...response.Errors.map((e) => ({
                key: e.Key || "unknown",
                code: e.Code || "UnknownError",
                message: e.Message || "Unknown error occurred",
              }))
            );
          }
        } catch (error) {
          // チャンク単位のエラー
          chunk.forEach((key) => {
            errors.push({
              key,
              code: "ChunkDeleteError",
              message: error instanceof Error ? error.message : String(error),
            });
          });
        }
      }
      
      return { deleted, errors };
    } catch (error) {
      logger.error({ error }, "S3互換APIでの一括削除に失敗、R2バインディングにフォールバックを試行します");
    }
  }

  // 2. R2バインディングを使用
  const client = await getR2Client(options);

  // R2 バインディングは一括削除をサポートしていないため、個別に削除
  for (const key of keys) {
    try {
      await client.delete(key);
      deleted.push(key);
    } catch (error) {
      errors.push({
        key,
        code: "DeleteError",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { deleted, errors };
}

/**
 * 指定されたプレフィックスを持つオブジェクトを R2 から一括削除
 *
 * @param prefix - 削除するプレフィックス
 * @param options - オプション
 * @returns 削除結果
 */
export async function deletePrefixFromR2(
  prefix: string,
  options?: { async?: boolean }
): Promise<{
  deleted: string[];
  errors: Array<{ key: string; code: string; message: string }>;
}> {
  if (!prefix) {
    throw new Error("Prefix is required for deletePrefixFromR2");
  }

  logger.info({ prefix }, "R2からプレフィックス指定でオブジェクトを一括削除開始");

  const keys = await listFromR2(prefix, options);

  if (keys.length === 0) {
    logger.info({ prefix }, "削除対象のオブジェクトが見つかりませんでした");
    return { deleted: [], errors: [] };
  }

  logger.info({ prefix, count: keys.length }, "オブジェクトの一括削除を実行します");
  const result = await deleteMultipleFromR2(keys, options);

  logger.info(
    { prefix, deletedCount: result.deleted.length, errorCount: result.errors.length },
    "一括削除が完了しました"
  );

  return result;
}
