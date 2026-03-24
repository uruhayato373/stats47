
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@stats47/logger";
import { createS3Client } from "../clients/create-s3-client";
import { getR2Client } from "../clients/get-r2-client";
import { detectEnvironment } from "../utils/detect-environment";

/**
 * Cloudflare REST API 経由でオブジェクト内容を取得
 * S3 API がプロキシでブロックされる場合のフォールバック
 */
async function fetchFromCloudflareApi(key: string): Promise<Buffer | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

  if (!accountId || !apiToken) return null;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, fetch: undiciFetch } = require("undici");
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`;
  const response = await undiciFetch(url, {
    dispatcher,
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Cloudflare API エラー: ${response.status} for key=${key}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * オブジェクトを R2 から取得（Buffer形式）
 *
 * @param key - オブジェクトキー
 * @param options - オプション
 * @returns オブジェクトのBuffer（存在しない場合はnull）
 */
export async function fetchFromR2(
  key: string,
  options?: { async?: boolean }
): Promise<Buffer | null> {
  const env = detectEnvironment();

  // 1. Cloudflare Workers環境 -> R2バインディングを優先使用
  //    失敗時はフォールバック（スクリプト実行時に isCloudflareWorkers=true でも S3/CF API へ続ける）
  if (env.isCloudflareWorkers) {
    try {
      const r2Client = await getR2Client(options);
      const object = await r2Client.get(key);

      if (!object) {
        return null;
      }

      const arrayBuffer = await object.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.warn({ key, error }, "R2バインディング経由での取得に失敗。S3/Cloudflare APIにフォールバックします");
      // fall through to S3 / Cloudflare API
    }
  }

  // 2. ローカル開発環境 -> S3クライアントを使用して取得
  //    失敗時は Cloudflare REST API にフォールバック（企業プロキシで S3 がブロックされる場合に対応）
  if (env.hasS3Credentials) {
    try {
      const s3Client = createS3Client();
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        return null;
      }

      const byteArray = await response.Body.transformToByteArray();
      return Buffer.from(byteArray);
    } catch (error: any) {
      if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      logger.warn({ key, error }, "S3クライアントでの取得に失敗。Cloudflare REST APIにフォールバックします");
      try {
        return await fetchFromCloudflareApi(key);
      } catch (cfError) {
        logger.error({ key, s3Error: error, cfError }, "S3・Cloudflare API 両方での取得に失敗しました");
        throw cfError;
      }
    }
  }

  // 3. その他の環境
  const errorMessage = "R2クライアントを取得できませんでした。S3互換APIの環境変数 (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY) が設定されているか確認してください。";

  logger.error({ key, ...env }, errorMessage);
  throw new Error(errorMessage);
}

/**
 * オブジェクトを R2 から取得（文字列形式）
 *
 * @param key - オブジェクトキー
 * @param encoding - 文字エンコーディング（デフォルト: utf-8）
 * @param options - オプション
 * @returns オブジェクトの文字列（存在しない場合はnull）
 */
export async function fetchFromR2AsString(
  key: string,
  encoding: BufferEncoding = "utf-8",
  options?: { async?: boolean }
): Promise<string | null> {
  const buffer = await fetchFromR2(key, options);
  if (!buffer) {
    return null;
  }
  return buffer.toString(encoding);
}

/**
 * オブジェクトを R2 から取得（JSON形式）
 *
 * @param key - オブジェクトキー
 * @param options - オプション
 * @returns パースされたオブジェクト（存在しない場合はnull）
 */
export async function fetchFromR2AsJson<T>(
  key: string,
  options?: { async?: boolean }
): Promise<T | null> {
  const text = await fetchFromR2AsString(key, "utf-8", options);
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    logger.error(
      {
        key,
        error: error instanceof Error ? error.message : String(error),
      },
      "JSONのパースに失敗しました"
    );
    return null;
  }
}
