#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { normalizeLedger } = require('./ledger-core.cjs');
const { parseUsageHistory, evaluateRoutingPolicy } = require('./routing-policy-core.cjs');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const POLICY_PATH = path.join(ROOT, '.claude/config/backlog-routing-policy.json');
const LEDGER_PATH = path.join(ROOT, '.claude/state/backlog-loop/ledger.json');
const USAGE_PATH = path.join(ROOT, '.claude/state/metrics/claude-usage/history.csv');
const EVAL_DIR = path.join(ROOT, '.claude/state/metrics/prompt-evals');

function getArg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : fallback;
}

export function main() {
  const now = getArg('--now', new Date().toISOString());
  const dryRun = process.argv.includes('--dry-run');
  const policy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
  const { ledger, recovered } = normalizeLedger(JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8')));
  if (recovered) throw new Error('ledger を正規化できないため policy を更新しない');

  const usageRows = parseUsageHistory(fs.readFileSync(USAGE_PATH, 'utf8'));
  const result = evaluateRoutingPolicy({ policy, ledger, usageRows, now });
  const dateKey = result.evaluation.generatedAt.slice(0, 10);
  const evalPath = path.join(EVAL_DIR, `${dateKey}.json`);

  let evalPreserved = false;
  if (!dryRun) {
    if (result.changes.length > 0) {
      fs.writeFileSync(POLICY_PATH, `${JSON.stringify(result.policy, null, 2)}\n`);
    }
    fs.mkdirSync(EVAL_DIR, { recursive: true });
    // 同日 retry で「変更済みの policy」を再評価すると changes=0 になる。
    // その結果で初回の passing diff 証拠を上書きしない。
    evalPreserved = fs.existsSync(evalPath) && result.changes.length === 0;
    if (!evalPreserved) {
      fs.writeFileSync(evalPath, `${JSON.stringify(result.evaluation, null, 2)}\n`);
    }
  }

  console.log(
    `[routing-policy] samples window=${result.evaluation.window.days}d, changes=${result.changes.length}`,
  );
  for (const decision of result.evaluation.decisions) {
    const rate = decision.successRate === null ? 'n/a' : decision.successRate.toFixed(3);
    console.log(
      `[routing-policy] ${decision.class} × ${decision.model}: ${decision.completed}/${decision.samples} (${rate}) → ${decision.decision}`,
    );
  }
  const evalSuffix = dryRun ? ' (dry-run)' : evalPreserved ? ' (preserved)' : '';
  console.log(`[routing-policy] eval=${path.relative(ROOT, evalPath)}${evalSuffix}`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
