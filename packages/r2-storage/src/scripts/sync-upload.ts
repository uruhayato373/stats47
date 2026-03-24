/**
 * .local/r2/ ディレクトリを R2 にアップロード（差分同期）
 *
 * 使い方:
 *   npm run r2:upload                    # .local/r2/ 全体をアップロード
 *   npm run r2:upload -- --prefix ranking   # ranking/ のみアップロード
 *   npm run r2:upload -- --dry-run          # 実行せずに対象ファイルを表示
 */

import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { listFromR2WithSize, saveToR2 } from "../lib";

// 環境変数をロード（モノレポルートの .env.local）
config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const OUTPUT_BASE = ".local/r2";
const R2_PREFIX_DEFAULT = "";
const CONCURRENCY = 8;

const CONTENT_TYPE_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
  ".topojson": "application/json",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mdx": "text/mdx; charset=utf-8",
};

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPE_MAP[ext] ?? "application/octet-stream";
}

function collectLocalFiles(
  dir: string,
  baseDir: string,
  prefixFilter: string
): Array<{ absolutePath: string; relativePath: string }> {
  const results: Array<{ absolutePath: string; relativePath: string }> = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Accessing private/template directories starting with _ should be skipped
      if (entry.name.startsWith("_")) continue;
      results.push(
        ...collectLocalFiles(fullPath, baseDir, prefixFilter)
      );
    } else if (entry.isFile()) {
      const relativePath = path.relative(baseDir, fullPath).split(path.sep).join("/");
      if (prefixFilter && !relativePath.startsWith(prefixFilter)) continue;
      results.push({ absolutePath: fullPath, relativePath });
    }
  }
  return results;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const prefixIdx = args.indexOf("--prefix");
  const prefixArg = prefixIdx !== -1 ? args[prefixIdx + 1]?.trim() : undefined;
  const prefix = prefixArg ?? R2_PREFIX_DEFAULT;

  const outputDir = path.join(process.cwd(), OUTPUT_BASE);
  if (!fs.existsSync(outputDir)) {
    console.error(`エラー: ${OUTPUT_BASE}/ ディレクトリが見つかりません (${outputDir})`);
    process.exit(1);
  }

  const baseDir = prefix
    ? path.join(outputDir, prefix)
    : outputDir;
  if (prefix && !fs.existsSync(baseDir)) {
    console.error(`エラー: ${OUTPUT_BASE}/${prefix}/ が見つかりません`);
    process.exit(1);
  }

  console.log(".local/r2/ を R2 にアップロード（差分同期）");
  if (dryRun) console.log("【DRY RUN】実際にはアップロードしません");
  if (prefix) console.log(`プレフィックス: ${prefix}`);

  const localFiles = collectLocalFiles(baseDir, baseDir, "");
  const r2KeyPrefix = prefix ? `${prefix}/` : "";
  const localFilesWithKey = localFiles.map((f) => ({
    ...f,
    key: r2KeyPrefix + f.relativePath.replace(/\\/g, "/"),
  }));

  console.log(`ローカル対象: ${localFilesWithKey.length} ファイル`);

  let remoteMap = new Map<string, number>();
  if (!dryRun && localFilesWithKey.length > 0) {
    const listPrefix = prefix || undefined;
    const remote = await listFromR2WithSize(listPrefix);
    remoteMap = new Map(remote.map((r) => [r.key, r.size]));
  }

  const toUpload: typeof localFilesWithKey = [];
  for (const f of localFilesWithKey) {
    const localSize = fs.statSync(f.absolutePath).size;
    const remoteSize = remoteMap.get(f.key);
    if (remoteSize !== undefined && remoteSize === localSize) continue;
    toUpload.push(f);
  }

  console.log(`アップロード対象: ${toUpload.length}（スキップ: ${localFilesWithKey.length - toUpload.length}）`);

  if (toUpload.length === 0) {
    console.log("同期の必要はありません。");
    return;
  }

  if (dryRun) {
    toUpload.slice(0, 20).forEach((f) => console.log(`  [DRY RUN] ${f.key}`));
    if (toUpload.length > 20) console.log(`  ... 他 ${toUpload.length - 20} 件`);
    return;
  }

  let uploaded = 0;
  let errors = 0;

  async function uploadOne(
    item: (typeof toUpload)[0]
  ): Promise<{ ok: boolean }> {
    try {
      const body = fs.readFileSync(item.absolutePath);
      await saveToR2(item.key, body, {
        contentType: getContentType(item.absolutePath),
      });
      return { ok: true };
    } catch (e) {
      console.error(`アップロード失敗: ${item.key}`, e);
      return { ok: false };
    }
  }

  for (let i = 0; i < toUpload.length; i += CONCURRENCY) {
    const chunk = toUpload.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(uploadOne));
    for (const r of results) (r.ok ? uploaded++ : errors++);
  }

  console.log("--- アップロード完了 ---");
  console.log(`アップロード: ${uploaded}`);
  console.log(`エラー: ${errors}`);

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
