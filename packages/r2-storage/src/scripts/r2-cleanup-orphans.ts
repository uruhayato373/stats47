/**
 * R2 orphan cleaner: manifest にないキーをリモート R2 から削除する
 */
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

config({ path: path.resolve(__dirname, "../../../..", ".env.local") });

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
const MANIFEST_PATH = path.resolve(__dirname, "../../../..", ".local/r2-manifest/_all.json");
const DRY_RUN = process.argv.includes("--dry-run");

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function listAllR2Keys(): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  let page = 0;

  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      ContinuationToken: continuationToken,
    }));
    page++;
    const count = res.Contents?.length ?? 0;
    process.stdout.write(`\rR2 一覧取得中... page ${page} (${keys.length + count} 件)`);
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  console.log();
  return keys;
}

async function deleteKeys(keys: string[]): Promise<void> {
  const CHUNK = 1000; // S3 DeleteObjects は 1000 件が上限
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);
    const res = await s3.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: chunk.map((k) => ({ Key: k })),
        Quiet: true,
      },
    }));
    deleted += chunk.length - (res.Errors?.length ?? 0);
    errors += res.Errors?.length ?? 0;
    if (res.Errors?.length) {
      for (const e of res.Errors) {
        console.error(`  FAIL: ${e.Key} - ${e.Message}`);
      }
    }
    console.log(`削除進捗: ${Math.min(i + CHUNK, keys.length)} / ${keys.length} (deleted: ${deleted}, errors: ${errors})`);
  }

  console.log(`\n--- 完了 ---`);
  console.log(`削除成功: ${deleted}`);
  console.log(`エラー: ${errors}`);
}

async function main() {
  if (!process.env.R2_S3_ENDPOINT || !process.env.R2_ACCESS_KEY_ID) {
    console.error("エラー: R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY が未設定");
    process.exit(1);
  }

  const manifest: Record<string, unknown> = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  const manifestKeys = new Set(Object.keys(manifest));
  console.log(`マニフェスト: ${manifestKeys.size} 件`);

  const r2Keys = await listAllR2Keys();
  console.log(`R2 総オブジェクト数: ${r2Keys.length}`);

  const orphans = r2Keys.filter((k) => !manifestKeys.has(k));
  console.log(`\n孤立オブジェクト（削除対象）: ${orphans.length}`);

  if (orphans.length === 0) {
    console.log("削除するものはありません。");
    return;
  }

  // プレフィックス別に内訳を表示
  const prefixCount: Record<string, number> = {};
  for (const k of orphans) {
    const prefix = k.split("/")[0];
    prefixCount[prefix] = (prefixCount[prefix] ?? 0) + 1;
  }
  console.log("\nプレフィックス別内訳:");
  for (const [p, c] of Object.entries(prefixCount).sort()) {
    console.log(`  ${p}/: ${c} 件`);
  }

  if (DRY_RUN) {
    console.log("\n--dry-run: 削除は実行しません。");
    return;
  }

  console.log("\n削除開始...");
  await deleteKeys(orphans);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
