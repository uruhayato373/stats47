
import type { R2ListOptions } from "@cloudflare/workers-types";
import { logger } from "@stats47/logger";
import { getR2Client } from "../clients/get-r2-client";
import { detectEnvironment } from "../utils/detect-environment";
import { findLocalR2Root } from "../utils/find-local-r2-root";

/**
 * dev モード: ローカルファイルシステム (.local/r2/) から一覧取得
 */
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

/**
 * Cloudflare REST API 経由でR2オブジェクト一覧を取得
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

    if (!response.ok) throw new Error(`Cloudflare API エラー: ${response.status}`);

    const json = await response.json() as {
      success: boolean;
      result: Array<{ key: string; size: number }>;
      result_info?: { cursor?: string; is_truncated?: boolean };
    };

    if (!json.success) throw new Error("Cloudflare API レスポンスが失敗");

    allObjects.push(...(json.result || []).filter((o) => o.key));
    cursor = json.result_info?.is_truncated ? json.result_info.cursor : undefined;
  } while (cursor);

  return allObjects;
}

/**
 * オブジェクト一覧を R2 から取得（ページネーション対応）
 *
 * dev 環境:              ローカルFS (.local/r2/)
 * Cloudflare Workers:   R2バインディング
 * スクリプト環境:        Cloudflare REST API
 */
export async function listFromR2(
  prefix?: string,
  options?: { async?: boolean }
): Promise<string[]> {
  const env = detectEnvironment();

  // 1. dev環境 -> ローカルファイルシステム
  if (env.isDevelopment) {
    return listFromLocalFs(prefix).map((o) => o.key);
  }

  // 2. スクリプト環境 -> Cloudflare REST API
  if (env.hasCloudflareApi) {
    try {
      const objects = await listFromCloudflareApi(prefix);
      logger.info({ prefix, keyCount: objects.length }, "Cloudflare REST API経由でオブジェクト一覧を取得完了");
      return objects.map((o) => o.key);
    } catch (error) {
      logger.error({ prefix, error }, "Cloudflare REST APIでの取得に失敗しました");
      throw error;
    }
  }

  // 3. Cloudflare Workers環境 -> R2バインディング
  try {
    const client = await getR2Client(options);
    const allKeys: string[] = [];
    let cursor: string | undefined = undefined;

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

  // 1. dev環境 -> ローカルファイルシステム
  if (env.isDevelopment) {
    return listFromLocalFs(prefix);
  }

  // 2. スクリプト環境 -> Cloudflare REST API
  if (env.hasCloudflareApi) {
    try {
      const objects = await listFromCloudflareApi(prefix);
      logger.info({ prefix, count: objects.length }, "Cloudflare REST API経由でオブジェクト一覧（サイズ付き）を取得");
      return objects;
    } catch (error) {
      logger.error({ prefix, error }, "Cloudflare REST APIでの取得に失敗しました");
      throw error;
    }
  }

  // 3. Cloudflare Workers環境 -> R2バインディング
  try {
    const client = await getR2Client(options);
    const allObjects: Array<{ key: string; size: number }> = [];
    let cursor: string | undefined = undefined;

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
