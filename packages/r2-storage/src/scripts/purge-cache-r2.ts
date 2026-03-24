/**
 * R2 キャッシュバケット パージスクリプト
 *
 * OpenNext ISR キャッシュ用の stats47-cache バケットの全オブジェクトを削除する。
 * キャッシュは次回アクセス時に自動再生成されるため安全。
 *
 * S3 API がプロキシでブロックされる場合は Cloudflare REST API にフォールバック。
 *
 * 使用方法: npx tsx packages/r2-storage/src/scripts/purge-cache-r2.ts
 */

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const BUCKET = "stats47-cache";

function createClient(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "環境変数が不足: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Cloudflare REST API 経由でオブジェクト一覧を取得（プロキシ対応）
 */
async function listFromCloudflareApi(): Promise<string[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID または CLOUDFLARE_API_TOKEN が未設定です");
  }

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
    const response = await undiciFetch(url, {
      dispatcher,
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API エラー: ${response.status}`);
    }

    const json = (await response.json()) as {
      success: boolean;
      result: Array<{ key: string; size: number }>;
      result_info?: { cursor?: string; is_truncated?: boolean };
    };

    if (!json.success) {
      throw new Error("Cloudflare API レスポンスが失敗");
    }

    allKeys.push(...(json.result || []).filter((o) => o.key).map((o) => o.key));
    cursor = json.result_info?.is_truncated ? json.result_info.cursor : undefined;
  } while (cursor);

  return allKeys;
}

/**
 * Cloudflare REST API 経由でオブジェクトを削除（プロキシ対応）
 */
async function deleteViaCloudflareApi(keys: string[]): Promise<number> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID または CLOUDFLARE_API_TOKEN が未設定です");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ProxyAgent, fetch: undiciFetch } = require("undici");
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;

  let deleted = 0;

  for (const key of keys) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`;
    const response = await undiciFetch(url, {
      dispatcher,
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (response.ok) {
      deleted++;
    } else {
      console.error(`  削除失敗: ${key} (${response.status})`);
    }

    if (deleted % 100 === 0 && deleted > 0) {
      console.log(`進捗: ${deleted}/${keys.length} 削除済み`);
    }
  }

  return deleted;
}

async function mainS3(): Promise<boolean> {
  const s3 = createClient();

  console.log(`バケット "${BUCKET}" を調査中（S3 API）...`);
  const allKeys: string[] = [];
  let totalSize = 0;
  let token: string | undefined;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        ContinuationToken: token,
        MaxKeys: 1000,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) allKeys.push(obj.Key);
      totalSize += obj.Size ?? 0;
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  console.log(`オブジェクト数: ${allKeys.length}`);
  console.log(`合計サイズ: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  if (allKeys.length === 0) {
    console.log("削除対象なし");
    return true;
  }

  let deleted = 0;
  for (let i = 0; i < allKeys.length; i += 1000) {
    const batch = allKeys.slice(i, i + 1000);
    const res = await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
    const errors = res.Errors ?? [];
    deleted += batch.length - errors.length;
    if (errors.length > 0) {
      console.error(
        `バッチ ${Math.floor(i / 1000) + 1}: ${errors.length}件のエラー`
      );
      for (const e of errors.slice(0, 3)) {
        console.error(`  - ${e.Key}: ${e.Message}`);
      }
    }
    console.log(`進捗: ${deleted}/${allKeys.length} 削除済み`);
  }

  console.log(
    `完了: ${deleted}件削除 (${(totalSize / 1024 / 1024).toFixed(2)} MB 解放)`
  );
  return true;
}

async function mainCloudflareApi(): Promise<boolean> {
  console.log(`バケット "${BUCKET}" を調査中（Cloudflare REST API）...`);
  const allKeys = await listFromCloudflareApi();

  console.log(`オブジェクト数: ${allKeys.length}`);

  if (allKeys.length === 0) {
    console.log("削除対象なし");
    return true;
  }

  const deleted = await deleteViaCloudflareApi(allKeys);

  console.log(`完了: ${deleted}/${allKeys.length}件削除`);
  return true;
}

async function main() {
  try {
    await mainS3();
  } catch (s3Error) {
    console.warn("S3 API での接続に失敗。Cloudflare REST API にフォールバックします。");
    await mainCloudflareApi();
  }
}

main().catch((err) => {
  console.error("エラー:", err);
  process.exit(1);
});
