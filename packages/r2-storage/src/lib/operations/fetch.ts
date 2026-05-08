
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@stats47/logger";
import { getR2Client } from "../clients/get-r2-client";
import { getS3Client } from "../clients/get-s3-client";
import { detectEnvironment } from "../utils/detect-environment";
import { findLocalR2Root } from "../utils/find-local-r2-root";

function fetchFromLocalFs(key: string): Buffer | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const r2Root = findLocalR2Root();
    if (!r2Root) return null;
    const filePath = path.join(r2Root, key);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

async function fetchFromS3(key: string): Promise<Buffer | null> {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
  const s3 = getS3Client();
  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
    if (!response.Body) return null;
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  } catch (err: unknown) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

/**
 * オブジェクトを R2 から取得（Buffer形式）
 *
 * 優先順位:
 *   1. ローカルFS (.local/r2/) — seeded / 手動配置ファイル（API 呼び出し不要）
 *   2. Cloudflare Workers R2バインディング
 *   3. S3 API（スクリプト環境）
 */
export async function fetchFromR2(
  key: string,
): Promise<Buffer | null> {
  const localData = fetchFromLocalFs(key);
  if (localData !== null) return localData;

  const env = detectEnvironment();

  if (env.isCloudflareWorkers) {
    try {
      const r2Client = await getR2Client();
      const object = await r2Client.get(key);
      if (!object) return null;
      const arrayBuffer = await object.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.warn({ key, error }, "R2バインディング経由での取得に失敗。S3 APIにフォールバックします");
    }
  }

  if (env.hasS3Credentials) {
    try {
      return await fetchFromS3(key);
    } catch (error) {
      logger.error({ key, error }, "S3 API での取得に失敗しました");
      throw error;
    }
  }

  const errorMessage = "R2クライアントを取得できませんでした。環境変数 R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_S3_ENDPOINT が設定されているか確認してください。";
  logger.error({ key, ...env }, errorMessage);
  throw new Error(errorMessage);
}

/**
 * オブジェクトを R2 から取得（文字列形式）
 */
export async function fetchFromR2AsString(
  key: string,
): Promise<string | null> {
  const buffer = await fetchFromR2(key);
  if (!buffer) return null;
  return buffer.toString("utf-8");
}

/**
 * オブジェクトを R2 から取得してJSONとしてパース
 */
export async function fetchFromR2AsJson<T>(
  key: string,
): Promise<T | null> {
  const str = await fetchFromR2AsString(key);
  if (!str) return null;
  return JSON.parse(str) as T;
}
