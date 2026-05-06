/**
 * R2 キャッシュバケット パージスクリプト
 *
 * OpenNext ISR キャッシュ用の stats47-cache バケットの全オブジェクトを削除する。
 * キャッシュは次回アクセス時に自動再生成されるため安全。
 *
 * 使用方法: npx tsx packages/r2-storage/src/scripts/purge-cache-r2.ts
 */

import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const BUCKET = "stats47-cache";

function getS3Client(): S3Client {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("環境変数が不足: R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  }
  return new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });
}

async function listAllKeys(s3: S3Client): Promise<string[]> {
  const allKeys: string[] = [];
  let token: string | undefined;

  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      MaxKeys: 1000,
      ContinuationToken: token,
    }));
    for (const obj of res.Contents ?? []) {
      if (obj.Key) allKeys.push(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return allKeys;
}

async function deleteKeys(s3: S3Client, keys: string[]): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;
  const CHUNK = 1000;

  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);
    const res = await s3.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: chunk.map((k) => ({ Key: k })), Quiet: false },
    }));
    deleted += res.Deleted?.length ?? 0;
    failed += res.Errors?.length ?? 0;
    if (res.Errors?.length) {
      for (const e of res.Errors) {
        console.error(`  削除失敗: ${e.Key} (${e.Code}: ${e.Message})`);
      }
    }
    if (i + CHUNK < keys.length) {
      console.log(`進捗: ${Math.min(i + CHUNK, keys.length)}/${keys.length} 処理済み`);
    }
  }

  return { deleted, failed };
}

async function main() {
  const s3 = getS3Client();

  console.log(`バケット "${BUCKET}" を調査中...`);
  const allKeys = await listAllKeys(s3);
  console.log(`オブジェクト数: ${allKeys.length}`);

  if (allKeys.length === 0) {
    console.log("削除対象なし");
    return;
  }

  const { deleted, failed } = await deleteKeys(s3, allKeys);
  console.log(`完了: ${deleted}件削除 / ${failed}件失敗`);
}

main().catch((err) => {
  console.error("エラー:", err);
  process.exit(1);
});
