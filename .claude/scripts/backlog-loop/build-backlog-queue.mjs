#!/usr/bin/env node
/**
 * backlog-loop のキューを組んで stdout へ JSON を出す CLI。
 *
 * 使い方:
 *   node .claude/scripts/backlog-loop/build-backlog-queue.mjs [--limit N] [--json] [--source 05,01,06]
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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

const POLICY_PATH = path.join(ROOT, '.claude/config/backlog-routing-policy.json');
const LEDGER_PATH = path.join(ROOT, '.claude/state/backlog-loop/ledger.json');

/** 見出し型を持つ真実源。01 は表形式なので Phase 2 で別経路にする */
const SOURCES = {
  '05': 'docs/todo/05_機能バックログ.md',
  '06': 'docs/todo/06_指標バックログ.md',
};

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

  const wanted = (getArg('--source', '05') ?? '05').split(',').map((s) => s.trim());
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
  const result = buildQueue({
    entries,
    ledger,
    quarantined: quarantinedIds(ledger, policy.limits?.quarantineThreshold),
    policy,
    limit: Number.isFinite(limitArg) ? limitArg : undefined,
  });

  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    policyVersion: policy.version ?? null,
    sources: wanted.map((k) => SOURCES[k]),
    totals: {
      parsed: entries.length,
      picked: result.picked.length,
      needsOwner: result.needsOwner.length,
      skipped: result.skipped.length,
    },
    ...result,
  };

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return payload;
  }

  console.log(
    `[queue] 解析 ${payload.totals.parsed} 件 → 処理 ${payload.totals.picked} / owner待ち ${payload.totals.needsOwner} / 除外 ${payload.totals.skipped}`,
  );
  for (const p of result.picked) {
    const route = p.route;
    const cls = p.knownClass ?? '(未分類 — モデルが判定)';
    console.log(`  tier${p.tier ?? '?'} ${p.id} — ${cls} / ${route.model} / ${route.apply}`);
  }
  if (result.needsOwner.length > 0) {
    console.log(`[queue] owner 待ち (surface のみ): ${result.needsOwner.map((n) => n.id).join(', ')}`);
  }
  return payload;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
