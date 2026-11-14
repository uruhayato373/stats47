#!/usr/bin/env node
/**
 * backlog の「承認待ちの一覧」「期日が来るカード」「流入と流出の数」を出す CLI。読むだけで、ファイルを書かない。
 *
 * 使い方 (npm run backlog:waits -- <サブコマンド> ...):
 *   approvals [--json]
 *       [待ち:承認] のカードを領域ごと・起票の古い順に 1 枚 1 行で出す (週次レビューでオーナーに見せる表)
 *   due [--from YYYY-MM-DD --to YYYY-MM-DD | --week YYYY-Www | --month YYYY-MM] [--json]
 *       backlog と年間計画から、期日が期間に入るカードと期日を過ぎて残っているカード。期間の指定が無ければ今週 (JST)
 *   flow [--weeks 8] [--today YYYY-MM-DD] [--json]
 *       週ごとの起票と完了の数、いまの総枚数・待ちの理由ごとの枚数・誰も持っていない古いカードの枚数
 *
 * 純関数は backlog-waits-core.cjs。ここは引数の解釈とファイルの読み込みと出力だけを持つ。
 * 正典: `.claude/rules/todo-standards.md` §3・§5・§7
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { jstDateOf } from '../metrics/lib/periods.mjs';

const require = createRequire(import.meta.url);
const { parseAnnual, parseBacklog } = require('../lib/backlog-lib.cjs');
const core = require('./backlog-waits-core.cjs');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CONFIG_PATH = '.claude/config/docs-governance.json';
const LEDGER_PATH = '.claude/state/backlog-loop/ledger.json';

const USAGE = `使い方: node .claude/scripts/backlog-loop/backlog-waits.mjs <approvals|due|flow> [オプション]
  approvals [--json]
  due [--from YYYY-MM-DD --to YYYY-MM-DD | --week YYYY-Www | --month YYYY-MM] [--json]   (指定なしは今週)
  flow [--weeks 8] [--today YYYY-MM-DD] [--json]`;

function readText(rel) {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
}

function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      from: { type: 'string' },
      to: { type: 'string' },
      week: { type: 'string' },
      month: { type: 'string' },
      weeks: { type: 'string', default: '8' },
      today: { type: 'string' },
    },
  });
  const [command] = positionals;
  if (values.help || !command) {
    console.log(USAGE);
    return values.help ? 0 : 2;
  }

  const config = JSON.parse(readText(CONFIG_PATH) || '{}');
  const todo = config.todo ?? {};
  const backlogFile = (todo.files ?? []).find((f) => f.endsWith('backlog.md')) ?? '.claude/todo/backlog.md';
  const annualFile = todo.annual?.file ?? '.claude/todo/annual.md';
  const backlogText = readText(backlogFile);
  const annualText = readText(annualFile);
  const today = values.today ?? jstDateOf();
  const print = (data, markdown) => console.log(values.json ? JSON.stringify(data, null, 2) : markdown);

  if (command === 'approvals') {
    const rows = core.buildApprovals(parseBacklog(backlogText));
    print({ count: rows.length, rows }, core.formatApprovals(rows));
    return 0;
  }
  if (command === 'due') {
    const range = core.resolveRange({ ...values, today });
    const report = core.buildDue({ backlogText, annualText, from: range.from, to: range.to });
    print({ label: range.label, ...report }, core.formatDue(report, range.label));
    return 0;
  }
  if (command === 'flow') {
    const weeks = Number(values.weeks);
    const ledgerText = readText(LEDGER_PATH);
    const flow = core.buildFlow({
      backlogCards: parseBacklog(backlogText),
      annualCards: parseAnnual(annualText),
      ledgerItems: ledgerText ? JSON.parse(ledgerText).items ?? {} : {},
      today,
      weeks,
      target: todo.backlogTargetCards,
      untriagedMaxAgeDays: todo.untriagedMaxAgeDays,
    });
    print(flow, core.formatFlow(flow));
    return 0;
  }
  console.error(`未知のサブコマンド: ${command}\n${USAGE}`);
  return 2;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
