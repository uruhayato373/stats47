
import { logger } from "@stats47/logger";
import { getR2Client } from "../clients/get-r2-client";
import { handleR2Error } from "../errors/handle-r2-error";
import { calculateBodySize } from "../utils/calculate-body-size";
import { convertBodyForR2 } from "../utils/convert-body-for-r2";
import { detectEnvironment } from "../utils/detect-environment";
import { findLocalR2Root } from "../utils/find-local-r2-root";

/**
 * dev モード: ローカルファイルシステム (.local/r2/) に保存
 */
function saveToLocalFs(
  key: string,
  body: string | ArrayBuffer | Buffer | Uint8Array,
): void {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  const r2Root = findLocalR2Root() ?? path.join(process.cwd(), ".local/r2");
  const filePath = path.join(r2Root, key);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let data: Buffer | string;
  if (Buffer.isBuffer(body)) {
    data = body;
  } else if (body instanceof ArrayBuffer) {
    data = Buffer.from(body);
  } else if (body instanceof Uint8Array) {
    data = Buffer.from(body);
  } else {
    data = String(body);
  }
  fs.writeFileSync(filePath, data);
}

/**
 * Cloudflare REST API 経由でオブジェクトを保存
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
 * dev 環境:              ローカルFS (.local/r2/)
 * Cloudflare Workers:   R2バインディング
 * スクリプト環境:        Cloudflare REST API
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

  // 1. dev環境 -> ローカルファイルシステム
  if (env.isDevelopment) {
    saveToLocalFs(key, body);
    return { key, size };
  }

  // 2. Cloudflare Workers環境 -> R2バインディング
  if (env.isCloudflareWorkers) {
    try {
      const r2Client = await getR2Client({ async: options?.async });
      const bodyToSave = convertBodyForR2(body);
      await r2Client.put(key, bodyToSave, {
        httpMetadata: { contentType: options?.contentType || "application/json" },
        customMetadata: options?.metadata,
      });
      return { key, size };
    } catch (error) {
      handleR2Error(error, { key, size }, "保存");
      throw error;
    }
  }

  // 3. スクリプト環境 -> Cloudflare REST API
  if (env.hasCloudflareApi) {
    try {
      await saveToCloudflareApi(key, body, options);
      logger.info({ key, size }, "Cloudflare REST API 経由でオブジェクト保存完了");
      return { key, size };
    } catch (error) {
      logger.error({ key, error }, "Cloudflare REST API での保存に失敗しました");
      throw error;
    }
  }

  const errorMessage = "R2クライアントを取得できませんでした。環境変数 CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN が設定されているか確認してください。";
  logger.error({ key, ...env }, errorMessage);
  throw new Error(errorMessage);
}
