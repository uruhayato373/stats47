/**
 * push-r2-wrangler — S3 認証なしで R2 へ push する薄い helper (完全DBレス deploy 用)。
 *
 * 既存の diff-push-r2.ts は S3 API (R2_ACCESS_KEY_ID 等) を使うが、cloud-first 化で
 * .env.local の S3 鍵は削除済。本 helper は wrangler CLI (`wrangler r2 object put --remote`)
 * を使うため S3 鍵不要 (CLOUDFLARE_API_TOKEN / `wrangler login` の認証を利用)。
 *
 * 用途: 再生成した snapshot を prefix 単位で cloud R2 へ反映する (ports / blog / areas 等の
 *       的を絞った deploy)。ranking-values 等の大量ファイルは S3 batch (diff-push-r2) を推奨。
 *
 * 使い方:
 *   # dry-run (既定、何を push するか一覧)
 *   npx tsx packages/r2-storage/src/scripts/push-r2-wrangler.ts app/ports
 *   # 実 push
 *   npx tsx packages/r2-storage/src/scripts/push-r2-wrangler.ts app/ports --apply
 *
 * 読み取りローカルルート: .local/r2 (CI が mkdir -p で作成する stage dir)。
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { findLocalR2Root } from "../lib/utils/find-local-r2-root";

import { assertR2WriteAllowed } from "./_assert-ci-write";
import { assertKsjPublicKeysAllowed } from "./lib/ksj-publication-guard";

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

function listFilesRecursive(root: string, rel = ""): string[] {
  const out: string[] = [];
  const dir = path.join(root, rel);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(root, childRel));
    } else if (entry.isFile()) {
      out.push(childRel);
    }
  }
  return out;
}

function main(): void {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  assertR2WriteAllowed({ op: "push-r2-wrangler (R2 push)", dryRun: !apply });
  const prefix = args.find((a) => !a.startsWith("--"));
  if (!prefix) {
    console.error("usage: push-r2-wrangler.ts <prefix> [--apply]  (例: app/ports)");
    process.exit(1);
  }

  const root = findLocalR2Root();
  if (!root) {
    console.error(
      "ローカル R2 ルートが見つかりません。sync-snapshots.yml で .local/r2 stage dir を生成してください。",
    );
    process.exit(1);
  }

  const prefixDir = path.join(root, prefix);
  if (!fs.existsSync(prefixDir)) {
    console.error(`prefix が存在しません: ${prefixDir}`);
    process.exit(1);
  }

  const files = listFilesRecursive(root, prefix);
  assertKsjPublicKeysAllowed(files);
  console.log(`${apply ? "PUSH" : "DRY-RUN"}: bucket=${BUCKET} prefix=${prefix} files=${files.length}`);

  if (!apply) {
    files.slice(0, 20).forEach((f) => console.log(`  would put ${f}`));
    if (files.length > 20) console.log(`  ... (+${files.length - 20} more)`);
    console.log("\n--apply を付けると実 push します。");
    return;
  }

  let done = 0;
  for (const key of files) {
    const filePath = path.join(root, key);
    execFileSync(
      "npx",
      ["wrangler", "r2", "object", "put", `${BUCKET}/${key}`, `--file=${filePath}`, "--remote"],
      { stdio: "inherit" },
    );
    done++;
    if (done % 50 === 0) console.log(`  ...${done}/${files.length}`);
  }
  console.log(`✅ pushed ${done} files (prefix=${prefix})`);
}

main();
