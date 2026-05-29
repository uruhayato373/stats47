#!/usr/bin/env node
// apps/remotion/out/ の「manifest 未記載 & 古い」ファイルを削除
// usage:
//   node .claude/scripts/remotion/prune.mjs               # dry-run, age >= 7d
//   node .claude/scripts/remotion/prune.mjs --age 0       # 全 unknown を即対象
//   node .claude/scripts/remotion/prune.mjs --age 7 --apply

import fs from "node:fs";
import path from "node:path";
import {
  OUT_DIR,
  collectKeepPaths,
  formatBytes,
  listFilesRecursively,
  loadManifest,
} from "./lib.mjs";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const AGE_DAYS = (() => {
  const i = args.indexOf("--age");
  return i >= 0 ? Number(args[i + 1]) : 7;
})();

const NEVER_TOUCH = new Set([".archive-manifest.json"]);

function main() {
  const manifest = loadManifest();
  const keep = collectKeepPaths(manifest);

  const all = listFilesRecursively(OUT_DIR);
  const cutoff = Date.now() - AGE_DAYS * 24 * 60 * 60 * 1000;

  /** @type {Array<{abs:string, size:number, mtime:number}>} */
  const candidates = [];
  for (const abs of all) {
    if (keep.has(abs)) continue;
    if (NEVER_TOUCH.has(path.basename(abs))) continue;
    const stat = fs.statSync(abs);
    if (stat.mtimeMs > cutoff) continue;
    candidates.push({ abs, size: stat.size, mtime: stat.mtimeMs });
  }

  if (candidates.length === 0) {
    console.log(`(no scratch files older than ${AGE_DAYS}d)`);
    return;
  }

  candidates.sort((a, b) => b.size - a.size);

  const totalSize = candidates.reduce((s, c) => s + c.size, 0);
  console.log(`mode: ${APPLY ? "APPLY" : "DRY-RUN"} | age >= ${AGE_DAYS}d`);
  console.log(`candidates: ${candidates.length}, total: ${formatBytes(totalSize)}\n`);

  for (const c of candidates) {
    const rel = path.relative(OUT_DIR, c.abs);
    const ageDays = ((Date.now() - c.mtime) / 86400000).toFixed(0);
    console.log(`  ${rel}  [${formatBytes(c.size)}, ${ageDays}d old]`);
  }

  if (!APPLY) {
    console.log("\n(re-run with --apply to delete)");
    return;
  }

  let deleted = 0;
  let failed = 0;
  for (const c of candidates) {
    try {
      fs.unlinkSync(c.abs);
      deleted++;
    } catch (err) {
      console.error(`[fail] ${c.abs}: ${err.message}`);
      failed++;
    }
  }
  // remove now-empty directories (also drop .DS_Store-only dirs)
  function removeEmptyDirs(dir) {
    if (!fs.existsSync(dir) || dir === OUT_DIR) return;
    for (const ds of fs.readdirSync(dir).filter((n) => n === ".DS_Store")) {
      try { fs.unlinkSync(path.join(dir, ds)); } catch { /* ignore */ }
    }
    const entries = fs.readdirSync(dir);
    if (entries.length === 0) {
      fs.rmSync(dir, { recursive: true, force: true });
      removeEmptyDirs(path.dirname(dir));
    }
  }
  const seenDirs = new Set(candidates.map((c) => path.dirname(c.abs)));
  for (const d of seenDirs) removeEmptyDirs(d);

  console.log(`\ndeleted: ${deleted}, failed: ${failed}`);
}

main();
