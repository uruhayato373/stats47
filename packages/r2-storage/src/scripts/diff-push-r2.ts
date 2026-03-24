/**
 * R2 差分同期スクリプト（wrangler CLI フォールバック対応）
 *
 * push 成功したファイルの key:size をマニフェストファイルに記録し、
 * 次回実行時はマニフェストと比較して差分のみ push する。
 * プロキシ環境でも動作する（リモート API 不要）。
 *
 * 使い方:
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix blog
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix blog --dry-run
 *   npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts  # 全体
 */

import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const BUCKET = "stats47";
const OUTPUT_BASE = ".local/r2";
const MANIFEST_DIR = ".local/r2-manifest";
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");

interface ManifestEntry {
  size: number;
  mtime: number;
}

type Manifest = Record<string, ManifestEntry>;

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
  const prefix = prefixIdx !== -1 ? args[prefixIdx + 1]?.trim() : "";

  const outputDir = path.join(PROJECT_ROOT, OUTPUT_BASE);
  const localDir = prefix ? path.join(outputDir, prefix) : outputDir;

  if (!fs.existsSync(localDir)) {
    console.error(`エラー: ${localDir} が見つかりません`);
    process.exit(1);
  }

  console.log("=== R2 差分同期（マニフェストベース） ===");
  if (dryRun) console.log("【DRY RUN】実際にはアップロードしません");
  if (prefix) console.log(`プレフィックス: ${prefix}`);

  // ローカルファイル収集
  const localFiles = collectLocalFiles(localDir, outputDir);
  console.log(`ローカルファイル: ${localFiles.length}`);

  // マニフェスト読み込み
  const manifest = loadManifest(prefix);
  const manifestKeys = new Set(Object.keys(manifest));
  console.log(`マニフェスト記録済み: ${manifestKeys.size}`);

  // 差分計算: サイズまたは mtime が変わったファイル、または未記録のファイル
  const toUpload = localFiles.filter((f) => {
    const entry = manifest[f.key];
    if (!entry) return true; // 新規
    if (entry.size !== f.size) return true; // サイズ変更
    if (entry.mtime < f.mtime) return true; // 更新
    return false;
  });

  // マニフェストにあるがローカルにないファイル（削除候補）
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

  // wrangler r2 object put で差分アップロード
  let success = 0;
  let errors = 0;
  const updatedManifest = { ...manifest };

  for (let i = 0; i < toUpload.length; i++) {
    const f = toUpload[i];
    const localPath = path.relative(PROJECT_ROOT, f.absolutePath).split(path.sep).join("/");
    try {
      execSync(
        `npx wrangler r2 object put "${BUCKET}/${f.key}" --file "${localPath}" --remote`,
        { cwd: PROJECT_ROOT, stdio: "pipe", timeout: 30000 }
      );
      success++;
      updatedManifest[f.key] = { size: f.size, mtime: f.mtime };

      if ((i + 1) % 50 === 0 || i + 1 === toUpload.length) {
        console.log(`Progress: ${i + 1} / ${toUpload.length} (success: ${success}, errors: ${errors})`);
        // 途中経過もマニフェストに保存（中断に備える）
        saveManifest(prefix, updatedManifest);
      }
    } catch (e: any) {
      errors++;
      console.error(`FAIL: ${f.key} - ${e.message?.split("\n")[0]}`);
    }
  }

  // 削除済みファイルをマニフェストから除去
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
