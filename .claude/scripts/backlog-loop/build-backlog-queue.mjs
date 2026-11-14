#!/usr/bin/env node
/**
 * backlog-loop のキューを組んで stdout へ JSON を出す CLI。
 *
 * 使い方:
 *   node .claude/scripts/backlog-loop/build-backlog-queue.mjs [--limit N] [--json]
 *   node .claude/scripts/backlog-loop/build-backlog-queue.mjs --dry-run [--top 10]
 *
 * どのモードもファイルを書かず、Claude も呼ばない (読むだけ。出力は stdout / stderr)。
 * `--dry-run` は対象になった全カードの並びの先頭 `--top` 件 (既定 10) と、選んだ理由を出す。
 * `--json` のときも人向けの要約 (選んだ理由・警告) を stderr に出す — workflow は stdout を
 * ファイルへ落とすので、stderr が run のログに残る。
 *
 * 選定の規則 (対象条件・並び順) は queue-core.cjs が持つ。今月の重点領域は
 * `.claude/todo/monthly.md` の frontmatter `focus_domains` (strategy-lanes.cjs の parseFocusLanes) を読む。
 * annual.md (時期・観測待ちの置き場) は SOURCES に入れない = 自動処理の対象にしない。
 *
 * 純関数は queue-core.cjs / parse-backlog-core.cjs / ledger-core.cjs にあり、
 * ここは I/O (ファイル読み込みと出力整形) だけを持つ。
 *
 * 正典: `.claude/rules/backlog-loop.md`
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { parseHeadingEntries } = require('./parse-backlog-core.cjs');
const { buildQueue } = require('./queue-core.cjs');
const { emptyLedger, normalizeLedger, quarantinedIds } = require('./ledger-core.cjs');
const { parseFocusLanes, readLanes } = require('../lib/strategy-lanes.cjs');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

const POLICY_PATH = path.join(ROOT, '.claude/config/backlog-routing-policy.json');
const LEDGER_PATH = path.join(ROOT, '.claude/state/backlog-loop/ledger.json');

const MONTHLY_PATH = '.claude/todo/monthly.md';
const DEFAULT_TOP = 10;

/**
 * カード型バックログの真実源 (v3-unified で 1 ファイルに統合)。
 * annual.md は入れない: 時期・観測待ちの置き場で、期日が来た週・月の計画が backlog へ戻す。
 */
const SOURCES = {
  backlog: '.claude/todo/backlog.md',
};

/**
 * 今月の重点領域を読む。読めなければ domains=null と、何が読めなかったかの警告を返す。
 * 領域の台帳に無い名前は捨てずに警告だけ出す (カードの [領域:] と一致しないので効かない)。
 * @returns {{domains: string[]|null, warnings: string[]}}
 */
function readFocusDomains() {
  const abs = path.join(ROOT, MONTHLY_PATH);
  if (!fs.existsSync(abs)) {
    return { domains: null, warnings: [`${MONTHLY_PATH} が無い`] };
  }
  const domains = parseFocusLanes(fs.readFileSync(abs, 'utf8'));
  if (domains === null) {
    return { domains: null, warnings: [`${MONTHLY_PATH} の frontmatter に focus_domains が無いか、frontmatter が壊れている`] };
  }
  const warnings = [];
  const known = new Set(readLanes(ROOT).lanes.map((l) => l.name));
  const unknown = domains.filter((d) => known.size > 0 && !known.has(d));
  if (unknown.length > 0) {
    warnings.push(`focus_domains に領域の台帳に無い名前がある: ${unknown.join(', ')} (カードの [領域:] と一致しない)`);
  }
  return { domains, warnings };
}

/** 人向けの要約。dry-run は stdout、--json は stderr に出す */
function summaryLines(payload, { top }) {
  const lines = [];
  const t = payload.totals;
  lines.push(
    `[queue] 解析 ${t.parsed} 件 → 対象 ${t.eligible} / 処理 ${t.picked} / owner待ち ${t.needsOwner} / 除外 ${t.skipped}`,
  );
  lines.push(`[queue] 今月の重点領域: ${payload.focusDomains ? payload.focusDomains.join(', ') : '(読めない)'}`);
  for (const w of payload.warnings) lines.push(`⚠️  [queue] ${w}`);
  lines.push('[queue] 並び: [1]不具合 → [2]重点領域 → [3]tier → [4]起票日の古い順 (無しは最後) → ID');
  if (top > 0) {
    lines.push(`[queue] 対象の先頭 ${Math.min(top, payload.ranked.length)} 件:`);
    payload.ranked.slice(0, top).forEach((r, i) => {
      lines.push(`  ${String(i + 1).padStart(2)}. ${r.id} — ${r.reason}`);
    });
  }
  lines.push('[queue] 今回の処理:');
  for (const p of payload.picked) {
    const cls = p.knownClass ?? '(未分類 — モデルが判定)';
    lines.push(`  ${p.id} — ${p.selection.reason} / ${cls} / ${p.route.model} / ${p.route.apply}`);
  }
  if (payload.needsOwner.length > 0) {
    lines.push(`[queue] owner 待ち (surface のみ): ${payload.needsOwner.map((n) => n.id).join(', ')}`);
  }
  return lines;
}

function getArg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : fallback;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export function main() {
  const policy = readJson(POLICY_PATH, null);
  if (!policy) {
    console.error(`❌ routing policy が読めない: ${POLICY_PATH}`);
    process.exit(1);
  }

  const { ledger, recovered } = normalizeLedger(readJson(LEDGER_PATH, emptyLedger()));
  if (recovered && fs.existsSync(LEDGER_PATH)) {
    console.error(`⚠️  ledger を読めなかったので空から再構築した: ${LEDGER_PATH}`);
  }

  const wanted = (getArg('--source', 'backlog') ?? 'backlog').split(',').map((s) => s.trim());
  const entries = [];
  for (const key of wanted) {
    const rel = SOURCES[key];
    if (!rel) {
      console.error(`❌ 未知の source: ${key} (有効: ${Object.keys(SOURCES).join(',')})`);
      process.exit(1);
    }
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.error(`❌ 真実源が無い: ${rel}`);
      process.exit(1);
    }
    entries.push(...parseHeadingEntries(fs.readFileSync(abs, 'utf8'), rel).entries);
  }

  // ★silent no-op ガード: パーサが壊れて 0 件になったら「処理対象なし」と誤認させない
  if (entries.length === 0) {
    console.error('❌ エントリを 1 件も解析できなかった (パーサかファイル形式の破壊を疑う)');
    process.exit(1);
  }

  const limitArg = Number.parseInt(getArg('--limit', ''), 10);
  const focus = readFocusDomains();
  const result = buildQueue({
    entries,
    ledger,
    quarantined: quarantinedIds(ledger, policy.limits?.quarantineThreshold),
    policy,
    limit: Number.isFinite(limitArg) ? limitArg : undefined,
    focusDomains: focus.domains,
  });

  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    policyVersion: policy.version ?? null,
    sources: wanted.map((k) => SOURCES[k]),
    totals: {
      parsed: entries.length,
      eligible: result.ranked.length,
      picked: result.picked.length,
      needsOwner: result.needsOwner.length,
      skipped: result.skipped.length,
    },
    ...result,
    // 「読めなかった」の詳細 (どのファイルが・何が) を先に、buildQueue の一般的な警告を後に置く
    warnings: [...focus.warnings, ...result.warnings],
  };

  const topArg = Number.parseInt(getArg('--top', ''), 10);
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    for (const line of summaryLines(payload, { top: 0 })) console.error(line);
    return payload;
  }

  const top = process.argv.includes('--dry-run') ? (Number.isFinite(topArg) ? topArg : DEFAULT_TOP) : 0;
  for (const line of summaryLines(payload, { top })) console.log(line);
  return payload;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
