/**
 * R2 のキーをローカル .local/r2/ にダウンロード（差分同期）
 *
 * R2にはキャッシュやバックアップも保存されているため、
 * 全体ダウンロードはデフォルトでは行わない。
 *
 * 使い方:
 *   npm run r2:download                          # デフォルトプレフィックスのみダウンロード
 *   npm run r2:download -- --prefix ranking      # ranking/ のみダウンロード
 *   npm run r2:download -- --prefix blog         # blog/ のみダウンロード
 *   npm run r2:download -- --all                 # R2 全体をダウンロード（非推奨）
 *   npm run r2:download -- --dry-run             # 実行せずに対象ファイルを表示
 */

import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fetchFromR2, listFromR2WithSize } from "../lib";

// 環境変数をロード（モノレポルートの .env.local）
config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

const OUTPUT_BASE = ".local/r2";
const CONCURRENCY = 8;

/** ローカル開発で必要なプレフィックス */
const DEFAULT_PREFIXES = [
  "ranking",
  "seeds",
  "area",
  "categories",
];

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const downloadAll = args.includes("--all");
  const prefixIdx = args.indexOf("--prefix");
  const prefixArg = prefixIdx !== -1 ? args[prefixIdx + 1]?.trim() : undefined;

  // ダウンロード対象のプレフィックスを決定
  let prefixes: string[];
  if (downloadAll) {
    prefixes = []; // 空 = フィルタなし（全体）
  } else if (prefixArg) {
    prefixes = [prefixArg];
  } else {
    prefixes = DEFAULT_PREFIXES;
  }

  const outputDir = path.join(process.cwd(), OUTPUT_BASE);

  console.log("R2 から .local/r2/ にダウンロード（差分同期）");
  if (dryRun) console.log("【DRY RUN】実際にはダウンロードしません");
  if (downloadAll) {
    console.log("⚠️  全体ダウンロードモード（キャッシュ等も含む）");
  } else if (prefixArg) {
    console.log(`プレフィックス: ${prefixArg}`);
  } else {
    console.log(`デフォルトプレフィックス: ${DEFAULT_PREFIXES.join(", ")}`);
  }

  // プレフィックスごとにリモートファイル一覧を取得
  let remoteFiles: Array<{ key: string; size: number }> = [];
  if (prefixes.length === 0) {
    // 全体
    remoteFiles = await listFromR2WithSize();
  } else {
    for (const prefix of prefixes) {
      const files = await listFromR2WithSize(prefix);
      remoteFiles.push(...files);
    }
  }

  if (remoteFiles.length === 0) {
    console.log("R2 に対象ファイルがありません。");
    return;
  }

  const toDownload: Array<{ key: string; size: number }> = [];
  for (const r of remoteFiles) {
    // ディレクトリマーカー（末尾 /）はスキップ
    if (r.key.endsWith("/")) continue;
    const localPath = path.join(outputDir, r.key.replace(/\//g, path.sep));
    try {
      const stat = fs.statSync(localPath);
      if (stat.size === r.size) continue;
    } catch {
      // ファイルが存在しない
    }
    toDownload.push(r);
  }

  console.log(`リモート: ${remoteFiles.length} ファイル`);
  console.log(`ダウンロード対象: ${toDownload.length}（スキップ: ${remoteFiles.length - toDownload.length}）`);

  if (toDownload.length === 0) {
    console.log("同期の必要はありません。");
    return;
  }

  if (dryRun) {
    toDownload.slice(0, 20).forEach((f) => console.log(`  [DRY RUN] ${f.key}`));
    if (toDownload.length > 20) console.log(`  ... 他 ${toDownload.length - 20} 件`);
    return;
  }

  let downloaded = 0;
  let errors = 0;

  async function downloadOne(item: { key: string }): Promise<{ ok: boolean }> {
    try {
      const buf = await fetchFromR2(item.key);
      if (buf === null) {
        console.error(`取得失敗（null）: ${item.key}`);
        return { ok: false };
      }
      const localPath = path.join(outputDir, item.key.replace(/\//g, path.sep));
      const dir = path.dirname(localPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(localPath, buf);
      return { ok: true };
    } catch (e) {
      console.error(`ダウンロード失敗: ${item.key}`, e);
      return { ok: false };
    }
  }

  for (let i = 0; i < toDownload.length; i += CONCURRENCY) {
    const chunk = toDownload.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(downloadOne));
    for (const r of results) (r.ok ? downloaded++ : errors++);
  }

  console.log("--- 完了 ---");
  console.log(`ダウンロード: ${downloaded}`);
  console.log(`エラー: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
