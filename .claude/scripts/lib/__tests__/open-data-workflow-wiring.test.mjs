// workflow (open-data-source-archive.yml) が旧パスの入口 .claude/scripts/open-data/normalize-ci.mjs を起動することを確かめる基盤のテスト。
// packages は .claude を参照しないので、normalize-ci.test.mjs から移した (assert は変えていない)。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { ROOT } from '../../../../packages/ops/src/open-data/lib/contracts.mjs';
import { temp } from '../../../../packages/ops/src/open-data/__tests__/fixtures.mjs';

const workflow = YAML.parse(fs.readFileSync(path.join(ROOT, '.github/workflows/open-data-source-archive.yml'), 'utf8'));
const steps = workflow.jobs.archive.steps;

for (const dryRun of ['true', 'false']) test(`workflow normalize shell forwards ${dryRun === 'true' ? '--dry-run' : '--apply'} with no separate write step`, (t) => {
  const root = temp(t);
  fs.writeFileSync(path.join(root, 'npm'), '#!/bin/bash\nexit 0\n', { mode: 0o755 });
  fs.writeFileSync(path.join(root, 'node'), '#!/bin/bash\nif [ "$1" = "-p" ]; then printf "private-bucket\\n"; else printf "%s\\n" "$*" >> "$CALLS"; fi\n', { mode: 0o755 });
  const step = steps.find((s) => s.run?.includes('normalize-ci.mjs'));
  const calls = path.join(root, 'calls');
  const result = spawnSync('bash', ['-e', '-c', step.run], { cwd: ROOT, env: { ...process.env, PATH: `${root}:${process.env.PATH}`, TARGET: 'dataset:test', DRY_RUN: dryRun, CALLS: calls }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const invocations = fs.readFileSync(calls, 'utf8').trim().split('\n');
  assert.equal(invocations.at(-1), `--import tsx .claude/scripts/open-data/normalize-ci.mjs --dataset test ${dryRun === 'true' ? '--dry-run' : '--apply'}`);
  assert.equal(invocations.some((line) => line.includes('lib/publish.mjs')), false);
});
