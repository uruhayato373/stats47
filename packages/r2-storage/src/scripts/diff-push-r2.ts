/**
 * R2 差分同期スクリプト（S3 API）
 *
 * push 成功したファイルの key:size をマニフェストファイルに記録し、
 * 次回実行時はマニフェストと比較して差分のみ push する。
 * マニフェストで絞った後、R2 の一覧 (size と ETag) と照合し、R2 にある object と中身が同じ
 * ファイルは送らない。CI の runner はマニフェストが毎回空なので、送らない判定はこの照合が担う
 * (判定と出典: lib/diff-push-remote-match.ts)。
 *
 * 止め (判定と送信の本体は diff-push-r2-core.ts、区分表は r2-key-classes.ts):
 * - R2 の一覧が取れないときは送らずに非 0 で止まる。照合せずに全件を送るのは --allow-full-upload のときだけ。
 * - R2 が唯一の正本 (authoritative・未登録を含む) の object を上書きする差分があれば、
 *   --allow-authoritative-overwrite が無いかぎり key を列挙して非 0 で止まる。新しい key の追加は止めない。
 *   CI (GITHUB_ACTIONS=true) では段階導入として既定は警告して続行し、R2_AUTHORITATIVE_GUARD=enforce で止める。
 * - 書いた後に送った件数と、抜き取り (最大 20 件) の HEAD 読み戻し (サイズ・ETag) を照合する。
 * - R2 から object を削除しない (ローカルから消えた key は manifest から外すだけ)。
 *
 * 使い方:
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix blog
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix blog --dry-run
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/stats --allow-authoritative-overwrite
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts  # 全体
 */

import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { assertR2WriteAllowed } from "./_assert-ci-write";
import {
  authoritativeOverwrites,
  formatDiffPushSummary,
  parseDiffPushFlags,
  planDiffPush,
  resolveAuthoritativeGuardMode,
  runDiffPush,
} from "./diff-push-r2-core";
import { remoteListPrefixes, type RemoteObjectSummary } from "./lib/diff-push-remote-match";
import { assertKsjPublicAssetsAllowed } from "./lib/ksj-publication-guard";
import { assertBlogPublicAssetsAllowed, BLOG_INDEX_KEY, blogSnapshotWriteCondition } from './lib/blog-publication-guard';
import { createS3ImageObjectStore } from '../image-pipeline';
import { SITE } from "@stats47/types";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || SITE.r2Bucket;
const OUTPUT_BASE = ".local/r2";
const MANIFEST_DIR = ".local/r2-manifest";
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CONCURRENCY = 8;

const CONTENT_TYPE_MAP: Record<string, string> = {
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
};

interface ManifestEntry {
  size: number;
  mtime: number;
}

type Manifest = Record<string, ManifestEntry>;

interface LocalFile {
  absolutePath: string;
  key: string;
  size: number;
  mtime: number;
}

function getContentType(key: string): string {
  const ext = path.extname(key).toLowerCase();
  return CONTENT_TYPE_MAP[ext] ?? "application/octet-stream";
}

function getManifestPath(prefix: string): string {
  const name = prefix || "_all";
  return path.join(PROJECT_ROOT, MANIFEST_DIR, `${name}.json`);
}

function loadManifest(prefix: string): Manifest {
  const p = getManifestPath(prefix);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function saveManifest(prefix: string, manifest: Manifest): void {
  const p = getManifestPath(prefix);
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(manifest, null, 2));
}

function collectLocalFiles(dir: string, baseDir: string): LocalFile[] {
  const results: LocalFile[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_")) continue;
      results.push(...collectLocalFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const key = path.relative(baseDir, fullPath).split(path.sep).join("/");
      const stat = fs.statSync(fullPath);
      results.push({ absolutePath: fullPath, key, size: stat.size, mtime: stat.mtimeMs });
    }
  }
  return results;
}

/** R2 の一覧から key ごとの size と ETag を集める (照合用。読み取りのみ) */
async function listRemoteObjects(
  s3: S3Client,
  prefixes: readonly string[],
): Promise<Map<string, RemoteObjectSummary>> {
  const remote = new Map<string, RemoteObjectSummary>();
  for (const listPrefix of prefixes) {
    let continuationToken: string | undefined;
    do {
      const response = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: listPrefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }));
      for (const object of response.Contents ?? []) {
        if (object.Key && object.Size !== undefined && object.ETag) {
          remote.set(object.Key, { size: object.Size, etag: object.ETag });
        }
      }
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);
  }
  return remote;
}

function createS3ClientFromEnv(): S3Client | null {
  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });
}

const md5OfFile = (f: LocalFile): string =>
  createHash("md5").update(fs.readFileSync(f.absolutePath)).digest("hex");

/** dry-run: 認証があれば R2 を一覧して本番と同じ判定を出す (読み取りのみ)。無ければ manifest で代用する */
async function printDryRun(prefix: string, toUpload: LocalFile[], removed: string[], manifest: Manifest,
  flags: ReturnType<typeof parseDiffPushFlags>): Promise<void> {
  const s3 = createS3ClientFromEnv();
  let remote: Map<string, RemoteObjectSummary> | null = null;
  let basis = "manifest (R2 と照合していない。実際に送る件数はこれ以下になる)";
  if (s3) {
    try {
      remote = await listRemoteObjects(s3, remoteListPrefixes(prefix, toUpload.map((f) => f.key)));
      basis = "R2 の一覧と照合";
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
      console.warn(`⚠ R2 の一覧を取れません: ${msg}。本番では --allow-full-upload が無いかぎり止まります`);
    }
  }
  const plan = planDiffPush({
    bucket: BUCKET,
    candidates: toUpload,
    removedKeys: removed,
    remote,
    md5Of: md5OfFile,
    fallbackChange: (f) => (manifest[f.key] ? "CHANGED" : "NEW"),
  });
  console.log(`\n区分別の差分 (${basis}):`);
  for (const line of formatDiffPushSummary(plan)) console.log(line);

  const shown = plan.entries.filter((e) => e.change !== "UNCHANGED");
  if (shown.length > 0) {
    console.log("\n[アップロード対象]");
    shown.slice(0, 30).forEach((e) => console.log(`  [${e.change}] (${e.class}) ${e.file.key} (${e.file.size} bytes)`));
    if (shown.length > 30) console.log(`  ... 他 ${shown.length - 30} 件`);
  }
  if (removed.length > 0) {
    console.log("\n[ローカル削除済み（R2 からは削除しない。リモートに残存の可能性あり）]");
    removed.slice(0, 10).forEach((k) => console.log(`  ${k}`));
    if (removed.length > 10) console.log(`  ... 他 ${removed.length - 10} 件`);
  }
  const overwrites = remote ? authoritativeOverwrites(plan) : [];
  if (overwrites.length > 0 && !flags.allowAuthoritativeOverwrite) {
    const outcome = resolveAuthoritativeGuardMode() === "enforce" ? "⛔ 本番では止まる" : "⚠ 本番では警告して続行 (CI の段階導入)";
    console.log(`\n${outcome}: authoritative の上書き ${overwrites.length} 件 (--allow-authoritative-overwrite が必要)`);
    overwrites.slice(0, 30).forEach((e) => console.log(`  [${e.change}] ${e.file.key}`));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const flags = parseDiffPushFlags(args);
  const prefixIdx = args.indexOf("--prefix");
  const prefix = prefixIdx !== -1 ? args[prefixIdx + 1]?.trim() ?? "" : "";

  const outputDir = path.join(PROJECT_ROOT, OUTPUT_BASE);
  const localDir = prefix ? path.join(outputDir, prefix) : outputDir;

  if (!fs.existsSync(localDir)) {
    console.error(`エラー: ${localDir} が見つかりません`);
    process.exit(1);
  }

  console.log("=== R2 差分同期（S3 API） ===");
  if (dryRun) console.log("【DRY RUN】実際にはアップロードしません");
  if (prefix) console.log(`プレフィックス: ${prefix}`);

  const localFiles = collectLocalFiles(localDir, outputDir);
  assertKsjPublicAssetsAllowed(localFiles.map((file) => file.key), (key) =>
    fs.readFileSync(path.join(outputDir, key)));
  assertBlogPublicAssetsAllowed(localFiles.map((file) => file.key), (key) =>
    fs.readFileSync(path.join(outputDir, key)));
  console.log(`ローカルファイル: ${localFiles.length}`);

  const manifest = loadManifest(prefix);
  const manifestKeys = new Set(Object.keys(manifest));
  console.log(`マニフェスト記録済み: ${manifestKeys.size}`);

  const toUpload = localFiles.filter((f) => {
    const entry = manifest[f.key];
    if (!entry) return true;
    if (entry.size !== f.size) return true;
    if (entry.mtime < f.mtime) return true;
    return false;
  });

  const localKeySet = new Set(localFiles.map((f) => f.key));
  const removed = [...manifestKeys].filter((k) => !localKeySet.has(k));

  console.log(`\n--- 差分 ---`);
  console.log(`アップロード対象: ${toUpload.length}`);
  console.log(`スキップ（一致）: ${localFiles.length - toUpload.length}`);
  console.log(`ローカル削除済み: ${removed.length}`);

  if (toUpload.length === 0 && removed.length === 0) {
    console.log("\n同期の必要はありません。");
    return;
  }

  if (dryRun) {
    await printDryRun(prefix, toUpload, removed, manifest, flags);
    return;
  }

  // ローカルでは、送る候補がすべて Mac で作る prefix のときだけ通す (区分表 r2-key-classes.ts)。
  // prefix 単位ではなく key 単位で引く (sns/ の中の sns/pref-silhouette/ は CI が書く)。
  // 送る候補が 0 件 (manifest の掃除だけ) なら R2 に書かないので検査しない。
  if (toUpload.length > 0) {
    assertR2WriteAllowed({ op: "diff-push-r2 (R2 push)", targets: toUpload.map((f) => f.key) });
  }

  const s3 = createS3ClientFromEnv();
  if (!s3) {
    console.error("エラー: R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY が未設定です");
    process.exit(1);
  }
  const store = createS3ImageObjectStore(s3, BUCKET);

  const updatedManifest = { ...manifest };
  let blogBody: Buffer | null = null;
  let blogCondition: Awaited<ReturnType<typeof blogSnapshotWriteCondition>> | null = null;

  const result = await runDiffPush<LocalFile>({
    bucket: BUCKET,
    prefix,
    candidates: toUpload,
    removedKeys: removed,
    flags,
    authoritativeGuard: resolveAuthoritativeGuardMode(),
    concurrency: CONCURRENCY,
    io: {
      list: (prefixes) => listRemoteObjects(s3, prefixes),
      md5Of: md5OfFile,
      head: async (key) => {
        const head = await store.head(key);
        return head ? { contentLength: head.contentLength, etag: head.etag } : null;
      },
      put: async (f) => {
        const body = f.key === BLOG_INDEX_KEY && blogBody ? blogBody : fs.readFileSync(f.absolutePath);
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: f.key,
          Body: body,
          ContentType: getContentType(f.key),
          ...(f.key === BLOG_INDEX_KEY && blogCondition ? {
            IfMatch: blogCondition.ifMatch, IfNoneMatch: blogCondition.ifNoneMatch,
          } : {}),
        }));
      },
    },
    beforeUpload: async (targets) => {
      const blogCandidate = targets.find((file) => file.key === BLOG_INDEX_KEY);
      if (!blogCandidate) return;
      blogBody = fs.readFileSync(blogCandidate.absolutePath);
      blogCondition = await blogSnapshotWriteCondition(blogBody, store);
    },
    // 次回の実行で照合を繰り返さないよう、R2 と同じだったファイルも送信済みとして記録する
    onUnchanged: (f) => { updatedManifest[f.key] = { size: f.size, mtime: f.mtime }; },
    onUploaded: (f) => { updatedManifest[f.key] = { size: f.size, mtime: f.mtime }; },
    onProgress: (processed, total, success, errors) => {
      if (processed === total || processed % 48 === 0) {
        console.log(`Progress: ${processed} / ${total} (success: ${success}, errors: ${errors})`);
        saveManifest(prefix, updatedManifest);
      }
    },
  }).finally(() => saveManifest(prefix, updatedManifest));

  for (const k of removed) {
    delete updatedManifest[k];
  }
  saveManifest(prefix, updatedManifest);

  console.log("\n--- 完了 ---");
  console.log(`アップロード成功: ${result.success}`);
  console.log(`エラー: ${result.errors}`);
  console.log(`読み戻し照合: ${result.readback.checked} 件`);
  console.log(`マニフェスト更新: ${getManifestPath(prefix)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
