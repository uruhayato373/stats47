
import type { R2ListOptions } from "@cloudflare/workers-types";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { logger } from "@stats47/logger";
import { getR2Client } from "../clients/get-r2-client";
import { getS3Client } from "../clients/get-s3-client";
import { detectEnvironment } from "../utils/detect-environment";
import { findLocalR2Root } from "../utils/find-local-r2-root";

function listFromLocalFs(prefix?: string): Array<{ key: string; size: number }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  const root = findLocalR2Root() ?? path.join(process.cwd(), ".local/r2");
  const dirPath = prefix ? path.join(root, prefix) : root;
  if (!fs.existsSync(dirPath)) return [];

  const results: Array<{ key: string; size: number }> = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        results.push({
          key: path.relative(root, fullPath),
          size: fs.statSync(fullPath).size,
        });
      }
    }
  }
  walk(dirPath);
  return results;
}

async function listFromS3(prefix?: string): Promise<Array<{ key: string; size: number }>> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
  const s3 = getS3Client();
  const allObjects: Array<{ key: string; size: number }> = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));
    for (const obj of response.Contents ?? []) {
      if (obj.Key) allObjects.push({ key: obj.Key, size: obj.Size ?? 0 });
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return allObjects;
}

/**
 * オブジェクト一覧を R2 から取得（ページネーション対応）
 *
 * dev 環境:              ローカルFS (.local/r2/)
 * Cloudflare Workers:   R2バインディング
 * スクリプト環境:        S3 API
 */
export async function listFromR2(
  prefix?: string,
  options?: { async?: boolean }
): Promise<string[]> {
  const env = detectEnvironment();

  if (env.isDevelopment) {
    return listFromLocalFs(prefix).map((o) => o.key);
  }

  if (env.hasS3Credentials) {
    try {
      const objects = await listFromS3(prefix);
      logger.info({ prefix, keyCount: objects.length }, "S3 API経由でオブジェクト一覧を取得完了");
      return objects.map((o) => o.key);
    } catch (error) {
      logger.error({ prefix, error }, "S3 APIでの取得に失敗しました");
      throw error;
    }
  }

  // Cloudflare Workers
  try {
    const client = await getR2Client(options);
    const allKeys: string[] = [];
    let cursor: string | undefined;

    do {
      const listOptions: R2ListOptions = prefix ? { prefix, cursor } : { cursor };
      const result = await client.list(listOptions);
      if (result.objects) allKeys.push(...result.objects.map((obj) => obj.key).filter(Boolean));
      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);

    logger.info({ prefix, keyCount: allKeys.length }, "R2バインディング経由でオブジェクト一覧を取得完了");
    return allKeys;
  } catch (error) {
    logger.error({ prefix, error }, "R2バインディング経由でオブジェクト一覧の取得に失敗");
    throw error;
  }
}

/**
 * オブジェクト一覧を R2 から取得（サイズ情報付き、ページネーション対応）
 */
export async function listFromR2WithSize(
  prefix?: string,
  options?: { async?: boolean }
): Promise<Array<{ key: string; size: number }>> {
  const env = detectEnvironment();

  if (env.isDevelopment) {
    return listFromLocalFs(prefix);
  }

  if (env.hasS3Credentials) {
    try {
      const objects = await listFromS3(prefix);
      logger.info({ prefix, count: objects.length }, "S3 API経由でオブジェクト一覧（サイズ付き）を取得");
      return objects;
    } catch (error) {
      logger.error({ prefix, error }, "S3 APIでの取得に失敗しました");
      throw error;
    }
  }

  // Cloudflare Workers
  try {
    const client = await getR2Client(options);
    const allObjects: Array<{ key: string; size: number }> = [];
    let cursor: string | undefined;

    do {
      const listOptions: R2ListOptions = prefix ? { prefix, cursor } : { cursor };
      const result = await client.list(listOptions);
      if (result.objects) {
        allObjects.push(...result.objects.map((obj) => ({ key: obj.key, size: obj.size || 0 })));
      }
      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);

    return allObjects;
  } catch (error) {
    logger.error({ prefix, error }, "R2バインディング経由でのオブジェクト一覧（サイズ付き）の取得に失敗しました");
    throw error;
  }
}
