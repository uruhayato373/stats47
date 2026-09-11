import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';

const workflow = yaml.load(
  fs.readFileSync(
    new URL(
      '../../../../.github/workflows/theme-chart-audit-weekly.yml',
      import.meta.url
    ),
    'utf8'
  )
);
const commitStep = workflow.jobs.audit.steps.find((step) =>
  step.name.includes('Commit observations')
);

test('daily planner gates heavy work, while failure artifacts and exit codes survive', () => {
  assert.equal(workflow.on.schedule[0].cron, '0 0 * * *');
  const steps = workflow.jobs.audit.steps;
  assert.ok(
    steps.findIndex((s) => s.id === 'plan') <
      steps.findIndex((s) => s.name === 'Install audit dependencies')
  );
  assert.match(
    steps.find((s) => s.name === 'Install audit dependencies').if,
    /plan.outputs.run/
  );
  const check = steps.find((s) => s.id === 'check');
  assert.match(check.run, /audit-theme-runtime.ts/);
  assert.match(check.run, /runtime_code=\$\{PIPESTATUS\[0\]\}/);
  const artifact = steps.find((s) =>
    s.uses?.startsWith('actions/upload-artifact@')
  );
  assert.match(artifact.if, /always\(\)/);
  assert.equal(artifact.with['include-hidden-files'], true);
  assert.ok(
    steps.indexOf(artifact) < steps.findIndex((s) => s.id === 'review'),
    'Failure evidence must be available before model review'
  );
  const verdict = steps.find((s) => s.name === 'Propagate audit failures');
  assert.match(verdict.run, /test "\$RUNTIME_CODE" = 0/);
  assert.match(verdict.if, /plan.outputs.run/);
});

test('review publishes only after guards and never deploys or auto-merges', () => {
  const steps = workflow.jobs.audit.steps;
  const verify = steps.findIndex((s) => s.id === 'review_check');
  const publish = steps.findIndex((s) => s.name === 'Publish verified review');
  assert.ok(verify < publish);
  assert.match(steps[publish].if, /success\(\)/);
  assert.match(steps[publish].run, /gh pr create --draft --base develop/);
  assert.doesNotMatch(
    steps[publish].run,
    /gh pr merge|push origin main|--force/
  );
  assert.match(steps.find((s) => s.id === 'review_plan').run, /--state open/);
  assert.match(
    steps[verify].run,
    /git diff --exit-code HEAD --.*check-theme-review.mjs/
  );
});

test('weekly observation commit preserves experiment checkpoints without staging unrelated files', (t) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-weekly-commit-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const observations = [
    '.claude/state/theme-charts/live-audit.json',
    '.claude/state/themes/quality.json',
    '.claude/state/themes/quality.definitions.json',
    '.claude/state/themes/quality.observations.json',
    '.claude/state/themes/quality.lastGoodObservations.json',
    '.claude/state/themes/portfolio.json',
    '.claude/state/themes/experiments.json',
    '.claude/state/themes/ci-followup.json',
  ];
  for (const file of [...observations, '.claude/state/themes/unrelated.json']) {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), '{}\n');
  }
  // Run the workflow shell; replace Git transport/index operations only.
  const stub = `git() {
    case "$1" in
      add) printf '%s\\n' "$3" >> staged ;;
      diff) return 1 ;;
      *) printf '%s\\n' "$1" >> calls ;;
    esac
  }\n`;
  const result = spawnSync('bash', ['-e', '-c', stub + commitStep.run], {
    cwd,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(
    fs.readFileSync(path.join(cwd, 'staged'), 'utf8').trim().split('\n').sort(),
    observations.sort()
  );
  assert.deepEqual(
    fs
      .readFileSync(path.join(cwd, 'calls'), 'utf8')
      .trim()
      .split('\n')
      .slice(-3),
    ['commit', 'pull', 'push']
  );
});

test('model results use typed structured output instead of prose JSON parsing', () => {
  const args = workflow.jobs.audit.steps.find(s => s.id === 'review').with.claude_args;
  const schema = JSON.parse(args.match(/--json-schema '([^']+)'/)[1]);
  assert.equal(schema.type, 'object');
  assert.deepEqual(schema.required, ['status', 'summary', 'findings', 'sourceReviews', 'tests']);
  assert.equal(schema.additionalProperties, false);
});
