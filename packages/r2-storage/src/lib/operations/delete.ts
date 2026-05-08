
import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { logger } from "@stats47/logger";
import { getR2Client } from "../clients/get-r2-client";
import { getS3Client } from "../clients/get-s3-client";
import { detectEnvironment } from "../utils/detect-environment";
import { findLocalR2Root } from "../utils/find-local-r2-root";
import { listFromR2 } from "./list";

function deleteFromLocalFs(key: string): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  const r2Root = findLocalR2Root() ?? path.join(process.cwd(), ".local/r2");
  const filePath = path.join(r2Root, key);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

async function deleteMultipleFromS3(keys: string[]): Promise<{
  deleted: string[];
  errors: Array<{ key: string; code: string; message: string }>;
}> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
  const s3 = getS3Client();
  const deleted: string[] = [];
  const errors: Array<{ key: string; code: string; message: string }> = [];
  const CHUNK = 1000;

  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);
    const response = await s3.send(new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: { Objects: chunk.map((k) => ({ Key: k })), Quiet: false },
    }));
    for (const d of response.Deleted ?? []) {
      if (d.Key) deleted.push(d.Key);
    }
    for (const e of response.Errors ?? []) {
      errors.push({ key: e.Key ?? "", code: e.Code ?? "DeleteError", message: e.Message ?? "" });
    }
  }
  return { deleted, errors };
}

/**
 * オブジェクトを R2 から削除
 *
 * dev 環境:              ローカルFS (.local/r2/)
 * Cloudflare Workers:   R2バインディング
 * スクリプト環境:        S3 API
 */
export async function deleteFromR2(
  key: string,
  options?: { async?: boolean }
): Promise<void> {
  const env = detectEnvironment();
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

  if (env.isDevelopment) {
    deleteFromLocalFs(key);
    return;
  }

  if (env.hasS3Credentials) {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    return;
  }

  const client = await getR2Client();
  await client.delete(key);
}

/**
 * 複数のオブジェクトを R2 から一括削除（S3 DeleteObjects で最大1000件/リクエスト）
 */
export async function deleteMultipleFromR2(
  keys: string[],
  options?: { async?: boolean }
): Promise<{
  deleted: string[];
  errors: Array<{ key: string; code: string; message: string }>;
}> {
  if (keys.length === 0) return { deleted: [], errors: [] };

  const env = detectEnvironment();
  const deleted: string[] = [];
  const errors: Array<{ key: string; code: string; message: string }> = [];

  if (env.isDevelopment) {
    for (const key of keys) {
      try {
        deleteFromLocalFs(key);
        deleted.push(key);
      } catch (error) {
        errors.push({ key, code: "DeleteError", message: error instanceof Error ? error.message : String(error) });
      }
    }
    return { deleted, errors };
  }

  if (env.hasS3Credentials) {
    return deleteMultipleFromS3(keys);
  }

  // Cloudflare Workers
  const client = await getR2Client();
  for (const key of keys) {
    try {
      await client.delete(key);
      deleted.push(key);
    } catch (error) {
      errors.push({ key, code: "DeleteError", message: error instanceof Error ? error.message : String(error) });
    }
  }
  return { deleted, errors };
}

/**
 * 指定されたプレフィックスを持つオブジェクトを R2 から一括削除
 */
export async function deletePrefixFromR2(
  prefix: string,
  options?: { async?: boolean }
): Promise<{
  deleted: string[];
  errors: Array<{ key: string; code: string; message: string }>;
}> {
  if (!prefix) throw new Error("Prefix is required for deletePrefixFromR2");

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
