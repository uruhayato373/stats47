/**
 * db-r2-sync: ローカルビルド DB (SQLite) を R2 経由で pull / push する。
 *
 * クラウド/CI セッションからデータ追加できるよう、SSOT である SQLite ファイル
 * (packages/database/.data/stats47.sqlite) を R2 の `database/stats47.sqlite` に
 * 持ち回る。push は soft lock + 世代バックアップ付き。
 *
 * 使い方:
 *   npx tsx packages/r2-storage/src/scripts/db-r2-sync.ts pull
 *   npx tsx packages/r2-storage/src/scripts/db-r2-sync.ts push
 *   LOCAL_DB_PATH=/abs/path.sqlite npx tsx ... pull
 *
 * 必要な env (.env.local or CI secrets):
 *   R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
 *   CLOUDFLARE_R2_BUCKET_NAME (default: stats47)
 */

import { config } from "dotenv";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

import { assertR2WriteAllowed } from "./_assert-ci-write";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

// R2 キー (URL 非対応のインフラデータなので app/ 配下ではなくルート直下 database/)
const DB_KEY = "database/stats47.sqlite";
const LOCK_KEY = "database/LOCK.json";
const HISTORY_PREFIX = "database/history/";
const HISTORY_KEEP = 10;
const LOCK_TTL_SEC = 900;

const LOCAL_DB_PATH =
  process.env.LOCAL_DB_PATH ??
  path.resolve(PROJECT_ROOT, "packages/database/.data/stats47.sqlite");

interface Lock {
  holder: string;
  acquired_at: number; // epoch sec
  ttl_sec: number;
}

function holderId(): string {
  const who = process.env.GITHUB_RUN_ID || process.env.USER || "local";
  return `${who}@${os.hostname()}`;
}

function createS3(): S3Client {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error(
      "エラー: R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY が未設定です",
    );
    process.exit(1);
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function getObjectBuffer(
  s3: S3Client,
  key: string,
): Promise<Buffer | null> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!res.Body) return null;
    // AWS SDK v3 (Node): Body は stream。transformToByteArray でまとめて取得。
    const bytes = await (
      res.Body as { transformToByteArray: () => Promise<Uint8Array> }
    ).transformToByteArray();
    return Buffer.from(bytes);
  } catch (e: unknown) {
    const name = (e as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw e;
  }
}

async function pull(s3: S3Client): Promise<void> {
  console.log(`⬇️  pull: r2://${BUCKET}/${DB_KEY} → ${LOCAL_DB_PATH}`);
  const buf = await getObjectBuffer(s3, DB_KEY);
  if (!buf) {
    console.error(
      `エラー: r2://${BUCKET}/${DB_KEY} が存在しません。初回は migrate + push で作成してください。`,
    );
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_DB_PATH, buf);
  console.log(`✅ pulled ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
}

async function acquireLock(s3: S3Client): Promise<void> {
  const existing = await getObjectBuffer(s3, LOCK_KEY);
  if (existing) {
    const lock = JSON.parse(existing.toString("utf-8")) as Lock;
    const ageSec = Date.now() / 1000 - lock.acquired_at;
    if (lock.holder !== holderId() && ageSec < lock.ttl_sec) {
      console.error(
        `エラー: lock が ${lock.holder} に保持されています (残り ${Math.ceil(
          lock.ttl_sec - ageSec,
        )}s)。push を中止します。`,
      );
      process.exit(1);
    }
    if (ageSec >= lock.ttl_sec) {
      console.warn(`⚠️  stale lock (${lock.holder}, age ${Math.floor(ageSec)}s) を上書きします`);
    }
  }
  const mine: Lock = {
    holder: holderId(),
    acquired_at: Math.floor(Date.now() / 1000),
    ttl_sec: LOCK_TTL_SEC,
  };
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: LOCK_KEY,
      Body: JSON.stringify(mine),
      ContentType: "application/json",
    }),
  );
}

async function releaseLock(s3: S3Client): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: LOCK_KEY }));
  } catch {
    /* best-effort */
  }
}

async function backupCurrent(s3: S3Client): Promise<void> {
  // 既存 DB を database/history/<utc>.sqlite に退避 (初回は存在しないので skip)
  const head = await getObjectBuffer(s3, DB_KEY);
  if (!head) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${DB_KEY}`,
      Key: `${HISTORY_PREFIX}${stamp}.sqlite`,
    }),
  );
}

async function pruneHistory(s3: S3Client): Promise<void> {
  const res = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: HISTORY_PREFIX }),
  );
  const keys = (res.Contents ?? [])
    .map((o) => o.Key!)
    .filter((k) => k.endsWith(".sqlite"))
    .sort(); // <utc>.sqlite は辞書順 = 時系列順
  const excess = keys.slice(0, Math.max(0, keys.length - HISTORY_KEEP));
  if (excess.length === 0) return;
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: excess.map((Key) => ({ Key })) },
    }),
  );
  console.log(`🧹 history prune: ${excess.length} 件削除 (保持 ${HISTORY_KEEP})`);
}

async function push(s3: S3Client): Promise<void> {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    console.error(`エラー: ローカルビルド DB が見つかりません: ${LOCAL_DB_PATH}`);
    process.exit(1);
  }
  await acquireLock(s3);
  try {
    await backupCurrent(s3);
    const body = fs.readFileSync(LOCAL_DB_PATH);
    console.log(`⬆️  push: ${LOCAL_DB_PATH} → r2://${BUCKET}/${DB_KEY}`);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: DB_KEY,
        Body: body,
        ContentType: "application/octet-stream",
      }),
    );
    await pruneHistory(s3);
    console.log(`✅ pushed ${(body.length / 1024 / 1024).toFixed(1)} MB`);
  } finally {
    await releaseLock(s3);
  }
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  if (cmd !== "pull" && cmd !== "push") {
    console.error("usage: db-r2-sync.ts <pull|push>");
    process.exit(1);
  }
  // push は R2 書き込み = CI/クラウド専用。pull (R2→ローカル読取) はガード対象外。
  if (cmd === "push") assertR2WriteAllowed({ op: "db:push (build DB → R2)" });
  const s3 = createS3();
  if (cmd === "pull") await pull(s3);
  else await push(s3);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
