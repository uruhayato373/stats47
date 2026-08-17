#!/usr/bin/env node
/**
 * 1 件分の処理結果を ledger へ記録する CLI。モデルは**必ずこれを経由**して記録する
 * (ledger を直接編集させない — 直接編集を許すと gate 証拠を捏造できてしまう)。
 *
 *   node .claude/scripts/backlog-loop/record-backlog-outcome.mjs \
 *     --id PERF-LOCAL-NAV-01 --class impl-small --outcome completed \
 *     --model sonnet --gate-commands "npm run type-check,npm test" --gate-pass \
 *     --evidence "..." [--run-id 123] [--turns 42] [--cost-usd 0.51]
 *
 * `--gate-pass` は **実際に実行したコマンドを --gate-commands に列挙した場合のみ**付ける。
 * 何も実行していないのに付けるのは進捗の捏造であり、evidence-based-judgment.md の
 * 「捏造進捗は最悪の失敗」に該当する。verify はこの記録と行削除を突合するだけなので、
 * ここで嘘をつくと run 全体が赤くなる。
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { emptyLedger, normalizeLedger, recordAttempt, OUTCOMES } = require('./ledger-core.cjs');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const LEDGER_PATH = path.join(ROOT, '.claude/state/backlog-loop/ledger.json');
const POLICY_PATH = path.join(ROOT, '.claude/config/backlog-routing-policy.json');

function getArg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : fallback;
}
const hasFlag = (flag) => process.argv.includes(flag);

export function main() {
  const id = getArg('--id');
  const className = getArg('--class');
  const outcome = getArg('--outcome');

  if (!id || !className || !outcome) {
    console.error('❌ --id / --class / --outcome は必須');
    process.exit(1);
  }
  if (!OUTCOMES.has(outcome)) {
    console.error(`❌ --outcome は ${[...OUTCOMES].join('|')} のいずれか (受領: ${outcome})`);
    process.exit(1);
  }

  const gateCommands = (getArg('--gate-commands', '') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const gatePass = hasFlag('--gate-pass');

  // ★completed を名乗るなら gate 証拠を要求する。ここで弾かないと verify まで嘘が進む
  if (outcome === 'completed' && (!gatePass || gateCommands.length === 0)) {
    console.error('❌ outcome=completed には --gate-commands と --gate-pass の両方が要る');
    console.error('   実行していないコマンドを書かないこと (verify が行削除と突合して落とす)');
    process.exit(1);
  }
  if (gatePass && gateCommands.length === 0) {
    console.error('❌ --gate-pass を付けるなら --gate-commands に実行したコマンドを列挙する');
    process.exit(1);
  }

  const policy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
  const raw = fs.existsSync(LEDGER_PATH) ? JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8')) : emptyLedger();
  const { ledger, recovered } = normalizeLedger(raw);
  if (recovered && fs.existsSync(LEDGER_PATH)) {
    console.error('⚠️  ledger を読めなかったので空から再構築した');
  }

  const num = (flag) => {
    const v = Number.parseFloat(getArg(flag, ''));
    return Number.isFinite(v) ? v : undefined;
  };

  const { ledger: next, item, quarantined } = recordAttempt(
    ledger,
    {
      id,
      class: className,
      outcome,
      at: new Date().toISOString(),
      model: getArg('--model'),
      effort: getArg('--effort'),
      runId: getArg('--run-id'),
      turns: num('--turns'),
      costUsd: num('--cost-usd'),
      gate: gateCommands.length > 0 ? { commands: gateCommands, pass: gatePass } : null,
      evidence: getArg('--evidence'),
      failReason: getArg('--fail-reason'),
      sourceFile: getArg('--source-file'),
      title: getArg('--title'),
    },
    policy.limits?.quarantineThreshold,
  );

  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  fs.writeFileSync(LEDGER_PATH, `${JSON.stringify(next, null, 2)}\n`);

  console.log(`[ledger] ${id} → ${outcome} (status=${item.status}, attempts=${item.attempts.length})`);
  if (quarantined) {
    console.log(
      `[ledger] ⚠️ ${id} を quarantine (${item.quarantine.failCount} 回連続失敗)。次回以降 queue から外れる`,
    );
  }
  return { item, quarantined };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
