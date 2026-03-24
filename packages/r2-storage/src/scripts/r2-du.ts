/**
 * R2 ディレクトリ別容量調査（du 相当）
 *
 * 使い方:
 *   npx tsx packages/r2-storage/src/scripts/r2-du.ts
 *   npx tsx packages/r2-storage/src/scripts/r2-du.ts --prefix blog
 *   npx tsx packages/r2-storage/src/scripts/r2-du.ts --depth 2
 *   npx tsx packages/r2-storage/src/scripts/r2-du.ts --files
 */

import { config } from "dotenv";
import * as path from "path";
import { listFromR2WithSize } from "../lib";
import { formatBytes } from "../lib/utils/format-bytes";

config({ path: path.resolve(__dirname, "..", "..", "..", "..", ".env.local") });

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const prefixIdx = args.indexOf("--prefix");
  const prefix = prefixIdx !== -1 ? args[prefixIdx + 1]?.trim() : undefined;
  const depthIdx = args.indexOf("--depth");
  const depth = depthIdx !== -1 ? parseInt(args[depthIdx + 1] ?? "1", 10) : 1;
  const showFiles = args.includes("--files");

  console.log("R2 容量調査...");
  if (prefix) console.log(`プレフィックス: ${prefix}`);
  if (!showFiles) console.log(`集計レベル: ${depth}`);

  const files = await listFromR2WithSize(prefix);

  if (files.length === 0) {
    console.log("対象ファイルがありません。");
    return;
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (showFiles) {
    // ファイル個別表示（サイズ降順）
    const sorted = [...files].sort((a, b) => b.size - a.size);
    const longestKey = Math.min(Math.max(...sorted.map((f) => f.key.length)), 80);
    for (const f of sorted) {
      console.log(`${formatBytes(f.size).padStart(12)}\t${f.key}`);
    }
  } else {
    // ディレクトリ集計
    const byDir = new Map<string, { size: number; count: number }>();
    for (const f of files) {
      if (f.key.endsWith("/")) continue;
      const segments = f.key.split("/");
      const key = segments.slice(0, depth).join("/");
      const cur = byDir.get(key) ?? { size: 0, count: 0 };
      byDir.set(key, { size: cur.size + f.size, count: cur.count + 1 });
    }

    const sorted = [...byDir.entries()].sort((a, b) => b[1].size - a[1].size);

    console.log("");
    console.log(`${"サイズ".padStart(12)}\t${"ファイル数".padStart(8)}\tパス`);
    console.log("-".repeat(60));
    for (const [dir, { size, count }] of sorted) {
      console.log(`${formatBytes(size).padStart(12)}\t${String(count).padStart(8)}\t${dir}/`);
    }
  }

  console.log("-".repeat(60));
  console.log(`${"合計:".padStart(12)}\t${String(files.length).padStart(8)}\t${formatBytes(totalSize)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
