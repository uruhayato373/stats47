#!/usr/bin/env node
/**
 * 教材 (参考文献) の分析企画を展開先へ引き渡し、済み・企画中・見送りを記録する入口 (npm run reference:expansion -- <command>)。
 * 規約: .claude/rules/reference-source-standards.md §5「分析企画の展開」。記録の正本は data/source-inventory/expansion.json。
 *
 *   status  [--channel c] [--json]            教材 × 展開先ごとの 済み (記録 / 自動判定)・企画中・見送り・未着手
 *   pending --channel c [--source key] [--limit n] [--json]
 *                                             未着手の企画と、同じ指標を使う公開中のページ (結ぶ候補)
 *   record  --analysis id --channel c --status done|planned|declined [--target <ページID>] [--reason 文] --by 誰
 *                                             記録を 1 件足す (検査に通ったものだけ書く)
 *   check                                     展開記録の Schema・企画の実在・展開先・ページ ID を検査する (PR・pre-commit)
 *
 * 展開先: ranking survey theme area japan blog note x instagram youtube。
 * ページ ID: data/content の id 体系 (blog:<slug>・note:<記事key>・sns:<投稿ID>・theme:<key>・area-theme:<code>:<theme> など)。
 */
import fs from 'node:fs';
import path from 'node:path';
import { datasetPath } from '../../../config/datasets.mjs';
import {
  CHANNELS, EXPANSION_ROOT, checkRecord, expansionStatus, loadAnalyses, loadChannelIndex, loadExpansion, suggestTargets, validateExpansion,
} from './lib/reference-expansion.mjs';

const [command, ...rest] = process.argv.slice(2);
const option = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : null);
const json = rest.includes('--json');

function context() {
  return { analyses: loadAnalyses(), ledger: loadExpansion(), index: loadChannelIndex() };
}

function status() {
  const { analyses, ledger, index } = context();
  const channel = option('--channel');
  const rows = expansionStatus(analyses, ledger, index).filter((r) => !channel || r.channel === channel);
  const table = new Map();
  for (const r of rows) {
    const key = `${r.analysis.sourceKey}/${r.analysis.edition}|${r.channel}`;
    const t = table.get(key) ?? { source: `${r.analysis.sourceKey}/${r.analysis.edition}`, channel: r.channel, done: 0, derived: 0, planned: 0, declined: 0, pending: 0 };
    t[r.state]++;
    table.set(key, t);
  }
  const list = [...table.values()].sort((a, b) => (a.channel + a.source < b.channel + b.source ? -1 : 1));
  const totals = {};
  for (const t of list) {
    const c = (totals[t.channel] ??= { done: 0, derived: 0, planned: 0, declined: 0, pending: 0 });
    for (const k of Object.keys(c)) c[k] += t[k];
  }
  if (json) return console.log(JSON.stringify({ totals, rows: list }, null, 2));
  console.log('展開先     済み(記録) 済み(自動) 企画中 見送り 未着手');
  for (const [c, t] of Object.entries(totals).sort())
    console.log(`${c.padEnd(10)} ${String(t.done).padStart(9)} ${String(t.derived).padStart(10)} ${String(t.planned).padStart(6)} ${String(t.declined).padStart(6)} ${String(t.pending).padStart(6)}`);
  if (channel) for (const t of list) console.log(`  ${t.source.padEnd(38)} 済み ${t.done + t.derived} / 企画中 ${t.planned} / 見送り ${t.declined} / 未着手 ${t.pending}`);
}

function pending() {
  const channel = option('--channel');
  if (!CHANNELS.includes(channel)) throw Error(`--channel は ${CHANNELS.join(' / ')} のどれか`);
  const { analyses, ledger, index } = context();
  const source = option('--source');
  const limit = Number(option('--limit') ?? 0);
  let rows = expansionStatus(analyses, ledger, index)
    .filter((r) => r.channel === channel && r.state === 'pending' && (!source || r.analysis.sourceKey === source));
  if (limit) rows = rows.slice(0, limit);
  const out = rows.map((r) => ({
    analysis: r.analysis.id, source: `${r.analysis.sourceKey}/${r.analysis.edition}`, question: r.analysis.question,
    metricKeys: r.analysis.metricKeys, nextAction: r.analysis.nextAction, candidates: suggestTargets(r.analysis, channel, index),
  }));
  if (json) return console.log(JSON.stringify(out, null, 2));
  for (const o of out) {
    console.log(`${o.analysis}  ${o.question}`);
    console.log(`    指標: ${o.metricKeys.slice(0, 6).join(', ')}${o.metricKeys.length > 6 ? ' …' : ''}`);
    if (o.candidates.length) console.log(`    同じ指標の公開物: ${o.candidates.map((c) => c.id).join(', ')}`);
  }
  console.log(`未着手 ${out.length} 件 (${channel})`);
}

function record() {
  const entry = {
    analysis: option('--analysis'), channel: option('--channel'), status: option('--status'),
    ...(option('--target') ? { target: option('--target') } : {}),
    ...(option('--reason') ? { reason: option('--reason') } : {}),
    decidedAt: new Date().toISOString().slice(0, 10), decidedBy: option('--by'),
  };
  if (!entry.analysis || !entry.channel || !entry.status || !entry.decidedBy) throw Error('--analysis --channel --status --by が必要');
  const { analyses, ledger, index } = context();
  const next = { ...ledger, records: [...ledger.records, entry] };
  const errors = [...checkRecord(entry, analyses.find((a) => a.id === entry.analysis), index), ...validateExpansion(next, analyses, index)];
  if (errors.length) throw Error(`記録しない:\n  ${[...new Set(errors)].join('\n  ')}`);
  next.records.sort((a, b) => (a.analysis + a.channel + (a.target ?? '') < b.analysis + b.channel + (b.target ?? '') ? -1 : 1));
  const file = path.join(EXPANSION_ROOT, datasetPath('source-inventory.expansion'));
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
  loadExpansion();
  console.log(`記録: ${entry.analysis} × ${entry.channel} = ${entry.status}${entry.target ? ` → ${entry.target}` : ''}`);
}

function check() {
  const { analyses, ledger, index } = context();
  const errors = validateExpansion(ledger, analyses, index);
  if (errors.length) {
    console.error(`✗ 展開記録: ${errors.length} 件\n  ${errors.join('\n  ')}`);
    process.exitCode = 1;
  } else console.log(`✓ 展開記録: ${ledger.records.length} 件 (企画 ${analyses.length} 件と照合)`);
}

const commands = { status, pending, record, check };
if (!commands[command]) {
  console.error('使い方: reference:expansion -- <status|pending|record|check> (詳細はファイル先頭)');
  process.exit(2);
}
try {
  commands[command]();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
