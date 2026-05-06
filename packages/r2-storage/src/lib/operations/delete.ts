
import { logger } from "@stats47/logger";
import { getR2Client } from "../clients/get-r2-client";
import { detectEnvironment } from "../utils/detect-environment";
import { findLocalR2Root } from "../utils/find-local-r2-root";
import { listFromR2 } from "./list";

/**
 * dev モード: ローカルファイルシステム (.local/r2/) から削除
 */
function deleteFromLocalFs(key: string): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  const r2Root = findLocalR2Root() ?? path.join(process.cwd(), ".local/r2");
  const filePath = path.join(r2Root, key);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

/**
 * Cloudflare REST API 経由で単一オブジェクトを削除
 */
async function deleteFromCloudflareApi(
  key: string,
  bucketName: string,
): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID または CLOUDFLARE_API_TOKEN が未設定です");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, fetch: undiciFetch } = require("undici");
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`;
  const response = await undiciFetch(url, {
    method: "DELETE",
    dispatcher,
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Cloudflare REST API での削除に失敗: ${response.status} for key=${key}`);
  }
}

/**
 * オブジェクトを R2 から削除
 *
 * dev 環境:              ローカルFS (.local/r2/)
 * Cloudflare Workers:   R2バインディング
 * スクリプト環境:        Cloudflare REST API
 */
export async function deleteFromR2(
  key: string,
  options?: { async?: boolean }
): Promise<void> {
  const env = detectEnvironment();
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

  // 1. dev環境 -> ローカルファイルシステム
  if (env.isDevelopment) {
    deleteFromLocalFs(key);
    return;
  }

  // 2. スクリプト環境 -> Cloudflare REST API
  if (env.hasCloudflareApi) {
    await deleteFromCloudflareApi(key, bucketName);
    return;
  }

  // 3. Cloudflare Workers環境 -> R2バインディング
  const client = await getR2Client(options);
  await client.delete(key);
}

/**
 * 複数のオブジェクトを R2 から一括削除
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
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
  const deleted: string[] = [];
  const errors: Array<{ key: string; code: string; message: string }> = [];

  // 1. dev環境 -> ローカルファイルシステム
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

  // 2. スクリプト環境 -> Cloudflare REST API (並列削除)
  if (env.hasCloudflareApi) {
    const CONCURRENCY = 10;
    for (let i = 0; i < keys.length; i += CONCURRENCY) {
      const chunk = keys.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async (key) => {
          try {
            await deleteFromCloudflareApi(key, bucketName);
            deleted.push(key);
          } catch (error) {
            errors.push({ key, code: "DeleteError", message: error instanceof Error ? error.message : String(error) });
          }
        })
      );
    }
    return { deleted, errors };
  }

  // 3. Cloudflare Workers環境 -> R2バインディング
  const client = await getR2Client(options);
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
