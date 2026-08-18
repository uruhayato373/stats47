#!/usr/bin/env node
/**
 * run の成果を検査する CLI。CI の verify step と `/process-backlog` の最後で必ず通す。
 *
 *   node .claude/scripts/backlog-loop/verify-backlog-run.mjs --base <git-ref> [--queued A,B]
 *
 * 検査:
 *   1. バックログから消えた ID に gate.pass=true の裏付けがあるか (無ければ fail)
 *   2. 変更パスが許可リスト内か (improvements / memory / learned / .env は禁止)
 *
 * `--base` は run 開始時点の ref (CI では処理前の HEAD)。そこからの差分で before を得る。
 * 判定は git diff の行ではなく **パーサで得た ID 集合の差**で行う (書式変更を削除と誤認しない)。
 *
 * 正典: `.claude/rules/backlog-loop.md`
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { verifyRemovals, verifyChangedPaths } = require('./verify-core.cjs');
const { emptyLedger, normalizeLedger } = require('./ledger-core.cjs');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const LEDGER_PATH = path.join(ROOT, '.claude/state/backlog-loop/ledger.json');

const TRACKED = ['.claude/todo/backlog.md'];

function getArg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : fallback;
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function fileAt(ref, rel) {
  try {
    return git(['show', `${ref}:${rel}`]);
  } catch {
    return null;
  }
}

function changedPaths(base) {
  const out = [];
  // base からの差分 (commit 済み) と working tree の両方を見る
  try {
    out.push(...git(['diff', '--name-only', base, 'HEAD']).split('\n').filter(Boolean));
  } catch {
    /* base==HEAD なら空 */
  }
  const porcelain = git(['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  for (const rec of porcelain.split('\0')) {
    if (!rec) continue;
    const p = rec.slice(3).trim();
    if (p) out.push(p);
  }
  return [...new Set(out)];
}

export function main() {
  const base = getArg('--base');
  if (!base) {
    console.error('❌ --base <git-ref> が要る (run 開始時点の HEAD)');
    process.exit(1);
  }
  const queuedArg = getArg('--queued');
  const queuedIds = queuedArg ? queuedArg.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const { ledger } = normalizeLedger(
    fs.existsSync(LEDGER_PATH) ? JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8')) : emptyLedger(),
  );

  const files = [];
  for (const rel of TRACKED) {
    const before = fileAt(base, rel);
    if (before === null) continue;
    const abs = path.join(ROOT, rel);
    const after = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    files.push({ sourceFile: rel, before, after });
  }

  const removal = verifyRemovals({ files, ledger, queuedIds });
  const paths = verifyChangedPaths(changedPaths(base));

  let failed = false;

  if (!paths.ok) {
    failed = true;
    console.error('❌ 触ってはいけないパスが変更されている:');
    for (const v of paths.violations) console.error(`   ${v.path} — ${v.reason}`);
  }

  if (!removal.ok) {
    failed = true;
    console.error('❌ 削除の裏付けが取れない:');
    for (const f of removal.findings) console.error(`   [${f.kind}] ${f.detail}`);
  }

  if (failed) {
    console.error('');
    console.error('   → 行削除は ledger に gate.pass=true の completed attempt がある ID だけに許される。');
    console.error('      機械ゲートを実行していないなら、行を戻して attempt を failed/deferred で記録すること。');
    process.exit(1);
  }

  console.log(`✓ backlog-loop verify OK (対象 ${files.length} ファイル / queued ${queuedIds?.length ?? 0} 件)`);
  return { removal, paths };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
