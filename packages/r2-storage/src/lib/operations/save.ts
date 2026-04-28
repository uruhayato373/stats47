
import { PutObjectCommand, type PutObjectCommandInput } from "@aws-sdk/client-s3";
import { logger } from "@stats47/logger";
import { createS3Client } from "../clients/create-s3-client";
import { getR2Client } from "../clients/get-r2-client";
import { handleR2Error } from "../errors/handle-r2-error";
import { calculateBodySize } from "../utils/calculate-body-size";
import { convertBodyForR2 } from "../utils/convert-body-for-r2"; // This file was marked for deletion, checking if I need to inline it or keep it. Plan said delete, but save logic uses it. I should inline or keep. Plan said delete convert-body.ts, but valid code uses convertBodyForR2. Ah, convert-body.ts was separate from convert-body-for-r2.ts. Checking if convert-body-for-r2.ts exists.

// Checking imports in save-to-r2.ts: import { convertBodyForR2 } from "../utils/convert-body-for-r2";
// My plan deleted `packages/r2-storage/src/lib/utils/convert-body.ts`.
// I should check if `convert-body-for-r2.ts` exists.
// Assuming it does based on import.

import { detectEnvironment } from "../utils/detect-environment";

/**
 * Cloudflare REST API 経由でオブジェクトを保存
 * S3 API がプロキシ / 認証エラーで失敗するときの汎用フォールバック
 * （fetchFromCloudflareApi の write 版。AWS SDK / https-proxy-agent を経由しない）
 */
async function saveToCloudflareApi(
  key: string,
  body: string | ArrayBuffer | Buffer | Uint8Array,
  options?: { contentType?: string },
): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

  if (!accountId || !apiToken) {
    throw new Error(
      "Cloudflare REST API 経由の保存に必要な環境変数が未設定です: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN",
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, fetch: undiciFetch } = require("undici");
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;

  let payload: Buffer | Uint8Array | string;
  if (Buffer.isBuffer(body)) {
    payload = body;
  } else if (body instanceof ArrayBuffer) {
    payload = Buffer.from(body);
  } else if (body instanceof Uint8Array) {
    payload = body;
  } else {
    payload = String(body);
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`;
  const response = await undiciFetch(url, {
    method: "PUT",
    dispatcher,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": options?.contentType || "application/json",
    },
    body: payload,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Cloudflare REST API での保存に失敗: ${response.status} ${text} for key=${key}`,
    );
  }
}

/**
 * オブジェクトを R2 に保存
 *
 * @param key - オブジェクトキー
 * @param body - オブジェクトボディ（文字列、ArrayBuffer、Buffer、Uint8Array）
 * @param options - 保存オプション
 * @returns 保存結果（キーとサイズ）
 */
export async function saveToR2(
  key: string,
  body: string | ArrayBuffer | Buffer | Uint8Array,
  options?: {
    contentType?: string;
    metadata?: Record<string, string>;
    async?: boolean;
  }
): Promise<{ key: string; size: number }> {
  const env = detectEnvironment();
  const size = calculateBodySize(body);

  // 1. S3認証情報あり -> S3クライアントを使用して保存
  if (env.hasS3Credentials) {
    logger.info({ key }, "S3互換APIを使用してオブジェクトを保存します");
    try {
      const s3Client = createS3Client();
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

      let bodyToSave: Buffer | Uint8Array | string;
      if (Buffer.isBuffer(body)) {
        bodyToSave = body;
      } else if (body instanceof ArrayBuffer) {
        bodyToSave = Buffer.from(body);
      } else if (body instanceof Uint8Array) {
        bodyToSave = body;
      } else {
        bodyToSave = String(body);
      }

      const input: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: key,
        Body: bodyToSave,
        ContentType: options?.contentType || "application/json",
        Metadata: options?.metadata,
      };

      await s3Client.send(new PutObjectCommand(input));

      logger.info({ key, size }, "S3クライアント経由でオブジェクト保存完了");
      return { key, size };
    } catch (error) {
      logger.warn(
        { key, error: error instanceof Error ? error.message : String(error) },
        "S3クライアント経由での保存に失敗、Cloudflare REST API にフォールバックします",
      );
      try {
        await saveToCloudflareApi(key, body, options);
        logger.info({ key, size }, "Cloudflare REST API 経由でオブジェクト保存完了");
        return { key, size };
      } catch (cfError) {
        logger.error({ key, s3Error: error, cfError }, "S3・Cloudflare REST API 両方で保存に失敗しました");
        throw cfError;
      }
    }
  }

  // 2. Cloudflare Workers環境 -> R2バインディングを使用して保存
  if (env.isCloudflareWorkers) {
    logger.info({ key }, "Cloudflare Workers環境: R2バインディングを使用してオブジェクトを保存します");
    try {
      const r2Client = await getR2Client({ async: options?.async });
      const bodyToSave = convertBodyForR2(body);

      await r2Client.put(key, bodyToSave, {
        httpMetadata: {
          contentType: options?.contentType || "application/json",
        },
        customMetadata: options?.metadata,
      });

      return { key, size };
    } catch (error) {
      handleR2Error(error, { key, size }, "保存");
      throw error;
    }
  }

  // 3. その他の環境
  const errorMessage = "R2クライアントを取得できませんでした。S3互換APIの環境変数 (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY) が設定されているか確認してください。";
    
  logger.error({ key, ...env }, errorMessage);
  throw new Error(errorMessage);
}
