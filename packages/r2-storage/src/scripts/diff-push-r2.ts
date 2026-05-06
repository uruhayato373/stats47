/**
 * R2 差分同期スクリプト（S3 API）
 *
 * push 成功したファイルの key:size をマニフェストファイルに記録し、
 * 次回実行時はマニフェストと比較して差分のみ push する。
 *
 * 使い方:
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix blog
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix blog --dry-run
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts  # 全体
 */

import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
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

function collectLocalFiles(
  dir: string,
  baseDir: string
): Array<{ absolutePath: string; key: string; size: number; mtime: number }> {
  const results: Array<{ absolutePath: string; key: string; size: number; mtime: number }> = [];
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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
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
    if (toUpload.length > 0) {
      console.log("\n[アップロード対象]");
      toUpload.slice(0, 30).forEach((f) => {
        const reason = !manifest[f.key] ? "NEW" : "CHANGED";
        console.log(`  [${reason}] ${f.key} (${f.size} bytes)`);
      });
      if (toUpload.length > 30) console.log(`  ... 他 ${toUpload.length - 30} 件`);
    }
    if (removed.length > 0) {
      console.log("\n[ローカル削除済み（リモートに残存の可能性あり）]");
      removed.slice(0, 10).forEach((k) => console.log(`  ${k}`));
      if (removed.length > 10) console.log(`  ... 他 ${removed.length - 10} 件`);
    }
    return;
  }

  const endpoint = process.env.R2_S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error("エラー: R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY が未設定です");
    process.exit(1);
  }
  const s3 = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });

  let success = 0;
  let errors = 0;
  const updatedManifest = { ...manifest };

  for (let i = 0; i < toUpload.length; i += CONCURRENCY) {
    const chunk = toUpload.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (f) => {
        try {
          const body = fs.readFileSync(f.absolutePath);
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: f.key,
            Body: body,
            ContentType: getContentType(f.key),
          }));
          success++;
          updatedManifest[f.key] = { size: f.size, mtime: f.mtime };
        } catch (e: unknown) {
          errors++;
          const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
          console.error(`FAIL: ${f.key} - ${msg}`);
        }
      })
    );

    const processed = Math.min(i + CONCURRENCY, toUpload.length);
    if (processed === toUpload.length || i % 48 === 0) {
      console.log(`Progress: ${processed} / ${toUpload.length} (success: ${success}, errors: ${errors})`);
      saveManifest(prefix, updatedManifest);
    }
  }

  for (const k of removed) {
    delete updatedManifest[k];
  }

  saveManifest(prefix, updatedManifest);

  console.log("\n--- 完了 ---");
  console.log(`アップロード成功: ${success}`);
  console.log(`エラー: ${errors}`);
  console.log(`マニフェスト更新: ${getManifestPath(prefix)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
