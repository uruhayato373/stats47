
import { logger } from "@stats47/logger";
import { getR2Client } from "../clients/get-r2-client";
import { detectEnvironment } from "../utils/detect-environment";
import { findLocalR2Root } from "../utils/find-local-r2-root";

/**
 * ローカルファイルシステム (.local/r2/) から読み込む
 * seeded data / 手動配置ファイルがある場合に API 呼び出しをスキップする
 */
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

/**
 * Cloudflare REST API 経由でオブジェクト内容を取得（429 リトライ付き）
 */
async function fetchFromCloudflareApi(key: string, retryCount = 0): Promise<Buffer | null> {
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

  if (response.status === 429 && retryCount < 3) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
    logger.warn({ key, retryCount, retryAfter }, "Cloudflare API rate limited (429)、リトライします");
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return fetchFromCloudflareApi(key, retryCount + 1);
  }

  if (!response.ok) {
    throw new Error(`Cloudflare API エラー: ${response.status} for key=${key}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * オブジェクトを R2 から取得（Buffer形式）
 *
 * 優先順位:
 *   1. ローカルFS (.local/r2/) — seeded / 手動配置ファイル（API 呼び出し不要）
 *   2. Cloudflare Workers R2バインディング
 *   3. Cloudflare REST API（429 リトライ付き）
 */
export async function fetchFromR2(
  key: string,
  options?: { async?: boolean }
): Promise<Buffer | null> {
  // 1. ローカルFS優先（環境問わず）— 存在すれば API 呼び出しをスキップ
  const localData = fetchFromLocalFs(key);
  if (localData !== null) return localData;

  const env = detectEnvironment();

  // 2. Cloudflare Workers環境 -> R2バインディング
  if (env.isCloudflareWorkers) {
    try {
      const r2Client = await getR2Client(options);
      const object = await r2Client.get(key);
      if (!object) return null;
      const arrayBuffer = await object.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.warn({ key, error }, "R2バインディング経由での取得に失敗。Cloudflare APIにフォールバックします");
    }
  }

  // 3. Cloudflare REST API（スクリプト環境 / Workers フォールバック）
  if (env.hasCloudflareApi) {
    try {
      return await fetchFromCloudflareApi(key);
    } catch (error) {
      logger.error({ key, error }, "Cloudflare REST API での取得に失敗しました");
      throw error;
    }
  }

  const errorMessage = "R2クライアントを取得できませんでした。環境変数 CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN が設定されているか確認してください。";
  logger.error({ key, ...env }, errorMessage);
  throw new Error(errorMessage);
}

/**
 * オブジェクトを R2 から取得（文字列形式）
 */
export async function fetchFromR2AsString(
  key: string,
  options?: { async?: boolean }
): Promise<string | null> {
  const buffer = await fetchFromR2(key, options);
  if (!buffer) return null;
  return buffer.toString("utf-8");
}

/**
 * オブジェクトを R2 から取得してJSONとしてパース
 */
export async function fetchFromR2AsJson<T>(
  key: string,
  options?: { async?: boolean }
): Promise<T | null> {
  const str = await fetchFromR2AsString(key, options);
  if (!str) return null;
  return JSON.parse(str) as T;
}
