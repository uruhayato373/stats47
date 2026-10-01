#!/usr/bin/env node
/**
 * ローカルの Claude Code transcript から、agent × モデル × effort の使用量を集計して残す (計測)。
 *
 *   node .claude/scripts/model-usage/collect-local-usage.mjs [--dir <transcripts dir>] [--dry-run]
 *
 * 読む: ~/.claude/projects/<repo の slug>*\/ (メイン = *.jsonl、agent = <session>/subagents/agent-*.jsonl + .meta.json)
 * 書く: .claude/state/metrics/model-usage/local-<platform>.json (集計値だけ。prompt・本文・依頼文は書かない)
 *
 * transcript は Claude Code の保持期間で消えるため、今回見えた週だけ置き換え、古い週は残す。
 * Mac と Windows で別ファイルにするのは、同じ週を 2 台が書いても互いに上書きしないため。
 * 計測は本体作業の成否を左右しない。読めない transcript は飛ばして件数だけ報告する。
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { markRun, mergeRows, mergeWeeks, rowsFromTranscript } from './usage-core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT_DIR = path.join(ROOT, '.claude/state/metrics/model-usage');
const PRICING = path.join(ROOT, '.claude/config/model-pricing.json');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

/** Claude Code が repo の絶対パスから作る projects 配下のディレクトリ名 (英数字以外を - にしたもの) */
export function projectSlug(root) {
  return root.replace(/[^A-Za-z0-9]/g, '-');
}

/** repo 本体と、その worktree (slug が前方一致する) の transcript ディレクトリ */
export function transcriptDirs(projectsDir, root) {
  if (!fs.existsSync(projectsDir)) return [];
  const slug = projectSlug(root);
  return fs
    .readdirSync(projectsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith(slug))
    .map((e) => path.join(projectsDir, e.name));
}

function readLines(file) {
  return fs.readFileSync(file, 'utf8').split('\n');
}

export function collect(dirs) {
  const rows = [];
  let transcripts = 0;
  let skipped = 0;
  for (const dir of dirs) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      try {
        if (e.isFile() && e.name.endsWith('.jsonl')) {
          rows.push(...markRun(rowsFromTranscript(readLines(p), { scope: 'main', agentType: '(main)' })));
          transcripts++;
        } else if (e.isDirectory() && fs.existsSync(path.join(p, 'subagents'))) {
          const sub = path.join(p, 'subagents');
          for (const f of fs.readdirSync(sub)) {
            if (!f.endsWith('.jsonl')) continue;
            const metaPath = path.join(sub, f.replace(/\.jsonl$/, '.meta.json'));
            const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
            rows.push(...markRun(rowsFromTranscript(readLines(path.join(sub, f)), { scope: 'sub', agentType: meta.agentType ?? 'unknown' })));
            transcripts++;
          }
        }
      } catch {
        skipped++;
      }
    }
  }
  return { rows, transcripts, skipped };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const projectsDir = arg('--dir') ?? path.join(os.homedir(), '.claude/projects');
  const pricing = JSON.parse(fs.readFileSync(PRICING, 'utf8'));
  const dirs = transcriptDirs(projectsDir, ROOT);
  const { rows, transcripts, skipped } = collect(dirs);
  const scanned = mergeRows(rows, pricing);

  const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : process.platform;
  const outFile = path.join(OUT_DIR, `local-${platform}.json`);
  const previous = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')).rows ?? [] : [];
  const merged = mergeWeeks(previous, scanned);
  const doc = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    platform,
    pricing: { source: pricing.source, observedAt: pricing.observedAt },
    scan: { dirs: dirs.length, transcripts, skipped, weeks: [...new Set(scanned.map((r) => r.week))].sort() },
    rows: merged,
  };
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({ ...doc, rows: `${merged.length} rows` }, null, 2));
  } else {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(outFile, `${JSON.stringify(doc, null, 2)}\n`);
    console.log(`記録: ${path.relative(ROOT, outFile)} (transcript ${transcripts} 本・読めず ${skipped}・週 ${doc.scan.weeks.join(', ') || 'なし'}・${merged.length} 行)`);
  }
}
