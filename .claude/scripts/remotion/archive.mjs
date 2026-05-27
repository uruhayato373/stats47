#!/usr/bin/env node
// apps/remotion/out/ から .local/r2/ に keep 対象を move する
// manifest: apps/remotion/out/.archive-manifest.json
// usage:
//   node .claude/scripts/remotion/archive.mjs          # dry-run
//   node .claude/scripts/remotion/archive.mjs --apply  # 実行
//   node .claude/scripts/remotion/archive.mjs --only migration-flow-47 --apply

import fs from "node:fs";
import path from "node:path";
import {
  OUT_DIR,
  R2_LOCAL,
  formatBytes,
  iterateSegmentFiles,
  loadManifest,
} from "./lib.mjs";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ONLY = (() => {
  const i = args.indexOf("--only");
  return i >= 0 ? args[i + 1] : null;
})();
const COPY = args.includes("--copy"); // move ではなく copy

function plan(manifest) {
  /** @type {Array<{slug:string, srcAbs:string, destAbs:string, size:number}>} */
  const moves = [];
  for (const [slug, project] of Object.entries(manifest.projects ?? {})) {
    if (ONLY && slug !== ONLY) continue;

    for (const item of project.keep ?? []) {
      const srcAbs = path.join(OUT_DIR, item.src);
      const destAbs = path.join(R2_LOCAL, item.dest);
      if (!fs.existsSync(srcAbs)) {
        console.warn(`[skip] ${slug}: source missing ${item.src}`);
        continue;
      }
      const size = fs.statSync(srcAbs).size;
      moves.push({ slug, srcAbs, destAbs, size });
    }

    const segments = Array.isArray(project.sns_segments)
      ? project.sns_segments
      : project.sns_segments
        ? [project.sns_segments]
        : [];
    for (const seg of segments) {
      const srcDir = path.join(OUT_DIR, seg.src_dir);
      const destDir = path.join(R2_LOCAL, seg.dest_dir);
      for (const f of iterateSegmentFiles(seg)) {
        const rel = path.relative(srcDir, f);
        const destAbs = path.join(destDir, rel);
        moves.push({ slug, srcAbs: f, destAbs, size: fs.statSync(f).size });
      }
    }
  }
  return moves;
}

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const manifest = loadManifest();
  const moves = plan(manifest);

  if (moves.length === 0) {
    console.log("(no moves planned)");
    return;
  }

  let totalSize = 0;
  let countPerSlug = {};
  for (const m of moves) {
    totalSize += m.size;
    countPerSlug[m.slug] = (countPerSlug[m.slug] || 0) + 1;
  }

  console.log(`mode: ${APPLY ? "APPLY" : "DRY-RUN"} | op: ${COPY ? "copy" : "move"}`);
  console.log(`projects: ${Object.keys(countPerSlug).length}, files: ${moves.length}, total: ${formatBytes(totalSize)}\n`);

  for (const [slug, count] of Object.entries(countPerSlug)) {
    console.log(`  ${slug}: ${count} files`);
  }
  console.log("");

  if (!APPLY) {
    console.log("sample (first 10):");
    for (const m of moves.slice(0, 10)) {
      const srcRel = path.relative(OUT_DIR, m.srcAbs);
      const destRel = path.relative(R2_LOCAL, m.destAbs);
      console.log(`  ${srcRel} → .local/r2/${destRel}  [${formatBytes(m.size)}]`);
    }
    console.log("\n(re-run with --apply to execute)");
    return;
  }

  let done = 0;
  let failed = 0;
  for (const m of moves) {
    try {
      ensureDir(m.destAbs);
      if (fs.existsSync(m.destAbs)) {
        const destSize = fs.statSync(m.destAbs).size;
        if (destSize === m.size) {
          // same content already at dest — remove source if move op
          if (!COPY && fs.realpathSync(m.srcAbs) !== fs.realpathSync(m.destAbs)) {
            fs.unlinkSync(m.srcAbs);
          }
          done++;
          continue;
        }
      }
      if (COPY) {
        fs.copyFileSync(m.srcAbs, m.destAbs);
      } else {
        try {
          fs.renameSync(m.srcAbs, m.destAbs);
        } catch (err) {
          if (err.code === "EXDEV") {
            fs.copyFileSync(m.srcAbs, m.destAbs);
            fs.unlinkSync(m.srcAbs);
          } else {
            throw err;
          }
        }
      }
      done++;
    } catch (err) {
      console.error(`[fail] ${m.srcAbs}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\ndone: ${done}, failed: ${failed}`);
}

main();
