/**
 * R2 キャッシュバケット パージスクリプト
 *
 * OpenNext ISR キャッシュ用の stats47-cache バケットの全オブジェクトを削除する。
 * キャッシュは次回アクセス時に自動再生成されるため安全。
 *
 * 使用方法: npx tsx packages/r2-storage/src/scripts/purge-cache-r2.ts
 */

import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const BUCKET = "stats47-cache";
const CONCURRENCY = 20;

function getApiBase(): { accountId: string; apiToken: string } {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error("環境変数が不足: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN");
  }
  return { accountId, apiToken };
}

async function listAllKeys(): Promise<string[]> {
  const { accountId, apiToken } = getApiBase();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, fetch: undiciFetch } = require("undici");
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;

  const allKeys: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const params = new URLSearchParams({ limit: "1000" });
    if (cursor) params.set("cursor", cursor);
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${BUCKET}/objects?${params}`;
    const res = await undiciFetch(url, { dispatcher, headers: { Authorization: `Bearer ${apiToken}` } });
    if (!res.ok) throw new Error(`Cloudflare API エラー: ${res.status}`);
    const json = await res.json() as {
      success: boolean;
      result: Array<{ key: string }>;
      result_info?: { cursor?: string; is_truncated?: boolean };
    };
    if (!json.success) throw new Error("Cloudflare API レスポンスが失敗");
    allKeys.push(...(json.result || []).filter((o) => o.key).map((o) => o.key));
    cursor = json.result_info?.is_truncated ? json.result_info.cursor : undefined;
  } while (cursor);

  return allKeys;
}

async function deleteKeys(keys: string[]): Promise<{ deleted: number; failed: number }> {
  const { accountId, apiToken } = getApiBase();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, fetch: undiciFetch } = require("undici");
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;

  let deleted = 0;
  let failed = 0;

  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const chunk = keys.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (key) => {
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`;
        const res = await undiciFetch(url, { method: "DELETE", dispatcher, headers: { Authorization: `Bearer ${apiToken}` } });
        if (res.ok || res.status === 404) {
          deleted++;
        } else {
          console.error(`  削除失敗: ${key} (${res.status})`);
          failed++;
        }
      })
    );
    if ((i + CONCURRENCY) % 200 === 0) {
      console.log(`進捗: ${Math.min(i + CONCURRENCY, keys.length)}/${keys.length} 処理済み`);
    }
  }

  return { deleted, failed };
}

async function main() {
  console.log(`バケット "${BUCKET}" を調査中...`);
  const allKeys = await listAllKeys();
  console.log(`オブジェクト数: ${allKeys.length}`);

  if (allKeys.length === 0) {
    console.log("削除対象なし");
    return;
  }

  const { deleted, failed } = await deleteKeys(allKeys);
  console.log(`完了: ${deleted}件削除 / ${failed}件失敗`);
}

main().catch((err) => {
  console.error("エラー:", err);
  process.exit(1);
});
