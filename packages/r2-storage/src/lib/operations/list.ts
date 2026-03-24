
import { ListObjectsV2Command, type ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import type { R2ListOptions } from "@cloudflare/workers-types";
import { logger } from "@stats47/logger";
import { createS3Client } from "../clients/create-s3-client";
import { getR2Client } from "../clients/get-r2-client";
import { detectEnvironment } from "../utils/detect-environment";

/**
 * Cloudflare REST API 経由でR2オブジェクト一覧を取得
 * S3 APIがプロキシでブロックされる場合のフォールバック
 */
async function listFromCloudflareApi(
  prefix?: string
): Promise<Array<{ key: string; size: number }>> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

  if (!accountId || !apiToken) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID または CLOUDFLARE_API_TOKEN が未設定です");
  }

  // undici の ProxyAgent でプロキシを通す（wrangler と同じ HTTP クライアント）
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, fetch: undiciFetch } = require("undici");
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;

  const allObjects: Array<{ key: string; size: number }> = [];
  let cursor: string | undefined = undefined;

  do {
    const params = new URLSearchParams({ limit: "1000" });
    if (prefix) params.set("prefix", prefix);
    if (cursor) params.set("cursor", cursor);

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects?${params}`;
    const response = await undiciFetch(url, {
      dispatcher,
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API エラー: ${response.status}`);
    }

    const json = await response.json() as {
      success: boolean;
      result: Array<{ key: string; size: number }>;
      result_info?: { cursor?: string; is_truncated?: boolean };
    };

    if (!json.success) {
      throw new Error("Cloudflare API レスポンスが失敗");
    }

    allObjects.push(...(json.result || []).filter((o) => o.key));
    cursor = json.result_info?.is_truncated ? json.result_info.cursor : undefined;
  } while (cursor);

  return allObjects;
}

/**
 * オブジェクト一覧を R2 から取得（ページネーション対応）
 *
 * 優先順位:
 * 1. S3互換API（環境変数が設定されている場合）
 * 2. R2バインディング（Cloudflare Workers環境）
 *
 * @param prefix - プレフィックス（オプション）
 * @param options - オプション
 * @returns オブジェクトキーの配列
 */
export async function listFromR2(
  prefix?: string,
  options?: { async?: boolean }
): Promise<string[]> {
  const env = detectEnvironment();

  // 1. S3互換APIが使用可能な場合
  if (env.hasS3Credentials) {
    try {
      logger.info({ prefix }, "S3互換APIを使用してR2からオブジェクト一覧を取得");
      const client = createS3Client();
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
      
      const allKeys: string[] = [];
      let continuationToken: string | undefined = undefined;

      do {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const response: ListObjectsV2CommandOutput = await client.send(command);
        if (response.Contents) {
          const keys = response.Contents.map((obj: { Key?: string }) => obj.Key || "").filter(Boolean);
          allKeys.push(...keys);
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
      } while (continuationToken);

      logger.info({ prefix, keyCount: allKeys.length }, "S3互換API経由でオブジェクト一覧を取得完了");
      return allKeys;
    } catch (error) {
      logger.error({ prefix, error }, "S3互換APIでの取得に失敗、R2バインディングにフォールバックを試行します");
    }
  }

  // 2. R2バインディングを使用
  try {
    const client = await getR2Client(options);
    const allKeys: string[] = [];
    let cursor: string | undefined = undefined;

    do {
      const listOptions: R2ListOptions = prefix ? { prefix, cursor } : { cursor };
      const result = await client.list(listOptions);

      if (result.objects) {
        const keys = result.objects.map((obj) => obj.key).filter(Boolean);
        allKeys.push(...keys);
      }

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
 *
 * @param prefix - プレフィックス（オプション）
 * @param options - オプション
 * @returns オブジェクトのキーとサイズ情報の配列
 */
export async function listFromR2WithSize(
  prefix?: string,
  options?: { async?: boolean }
): Promise<Array<{ key: string; size: number }>> {
  const env = detectEnvironment();

  // 1. S3認証情報あり -> S3クライアントを使用して取得
  //    失敗時は Cloudflare REST API にフォールバック（企業プロキシで S3 がブロックされる場合に対応）
  if (env.hasS3Credentials) {
    try {
      const client = createS3Client();
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

      const allObjects: Array<{ key: string; size: number }> = [];
      let continuationToken: string | undefined = undefined;

      do {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });

        const response: ListObjectsV2CommandOutput = await client.send(command);
        if (response.Contents) {
          const objects = response.Contents.map((obj: { Key?: string; Size?: number }) => ({
            key: obj.Key || "",
            size: obj.Size || 0,
          })).filter((obj: { key: string }) => obj.key);
          allObjects.push(...objects);
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
      } while (continuationToken);

      return allObjects;
    } catch (s3Error) {
      logger.warn({ prefix, error: s3Error }, "S3クライアントでの取得に失敗。Cloudflare REST APIにフォールバックします");
      try {
        const objects = await listFromCloudflareApi(prefix);
        logger.info({ prefix, count: objects.length }, "Cloudflare REST API経由でオブジェクト一覧を取得");
        return objects;
      } catch (cfError) {
        logger.error({ prefix, s3Error, cfError }, "S3・Cloudflare API 両方で取得に失敗しました");
        throw cfError;
      }
    }
  }

  // 2. R2バインディングを使用して取得
  try {
    const client = await getR2Client(options);
    const allObjects: Array<{ key: string; size: number }> = [];
    let cursor: string | undefined = undefined;

    do {
      const listOptions: R2ListOptions = prefix ? { prefix, cursor } : { cursor };
      const result = await client.list(listOptions);

      if (result.objects) {
        const objects = result.objects.map((obj) => ({
          key: obj.key,
          size: obj.size || 0,
        }));
        allObjects.push(...objects);
      }

      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);

    return allObjects;
  } catch (error) {
    logger.error({ prefix, error }, "R2バインディング経由でのオブジェクト一覧（サイズ付き）の取得に失敗しました");
    throw error;
  }
}
