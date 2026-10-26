'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '../../../..');
// テーマ監査は 2026-10-26 に theme-chart-audit-weekly.yml から quality-suite-weekly.yml の theme job へ移した
const THEME = path.join(ROOT, '.github/workflows/quality-suite-weekly.yml');

function parse(source) {
  return YAML.parse(source);
}

function stepsOf(workflow) {
  return workflow?.jobs?.theme?.steps ?? [];
}

function auditTheme(source) {
  const steps = stepsOf(parse(source));
  const check = steps.find((step) => step.id === 'check');
  const final = steps.find((step) => step.name === 'Propagate audit failures');
  const errors = [];
  for (const kind of ['live', 'quality', 'runtime']) {
    if (!check?.run?.includes(`${kind}_code=\${PIPESTATUS[0]}`)) {
      errors.push(`${kind} audit exit code is not captured`);
    }
  }
  if (!check?.run?.includes('alert_code=$?')) {
    errors.push('alert exit code is not captured');
  }
  if (check?.if !== "steps.plan.outputs.run == 'true'") errors.push('heavy audit planner gate is missing');
  if (!check?.run?.includes('summary_code=$?')) errors.push('summary exit code is not captured');
  if (!final || final.if !== "always() && steps.plan.outputs.run == 'true'" || typeof final.run !== 'string') {
    errors.push('always live audit propagation step is missing');
  } else {
    const bindings = {
      CHECK_OUTCOME: 'steps.check.outcome',
      LIVE_CODE: 'steps.check.outputs.live_code',
      QUALITY_CODE: 'steps.check.outputs.quality_code',
      ALERT_CODE: 'steps.check.outputs.alert_code',
      SUMMARY_CODE: 'steps.check.outputs.summary_code',
      RUNTIME_CODE: 'steps.check.outputs.runtime_code',
    };
    for (const [key, expression] of Object.entries(bindings)) {
      if (final.env?.[key] !== '${{ ' + expression + ' }}') errors.push(`${key} is not propagated`);
    }
    const success = { CHECK_OUTCOME: 'success', LIVE_CODE: '0', QUALITY_CODE: '0', ALERT_CODE: '0', SUMMARY_CODE: '0', RUNTIME_CODE: '0' };
    const cases = [success, ...Object.keys(success).map((key) => ({ ...success, [key]: key === 'CHECK_OUTCOME' ? 'failure' : '1' }))];
    for (const [index, env] of cases.entries()) {
      const result = spawnSync('bash', ['-c', final.run], { env: { ...process.env, ...env }, timeout: 2000 });
      if (result.error || (result.status === 0) !== (index === 0)) errors.push(`audit status propagation failed: ${JSON.stringify(env)}`);
    }
  }
  return errors;
}

const themeSource = fs.readFileSync(THEME, 'utf8');

// 出典監査 (provenance) は 2026-10-26 に週次レビューへ移した。失敗の伝播は台本 provenance.sh の振る舞いテスト
// (.claude/scripts/management/__tests__/weekly-audits.test.mjs) が持つ。
test('実workflowはlive監査の失敗をIssue更新後のjob statusへ伝播する', () => {
  assert.deepEqual(auditTheme(themeSource), []);
});

for (const kind of ['live', 'quality', 'runtime']) {
  test(`[mutation] theme ${kind}監査exit codeの固定0化を検出する`, () => {
    const mutated = themeSource.replace(`${kind}_code=\${PIPESTATUS[0]}`, `${kind}_code=0`);
    assert.notEqual(mutated, themeSource);
    assert.ok(auditTheme(mutated).includes(`${kind} audit exit code is not captured`));
  });
}

test('[mutation] theme最終statusの無条件成功を検出する', () => {
  const workflow = parse(themeSource);
  workflow.jobs.theme.steps.find((step) => step.name === 'Propagate audit failures').run = 'exit 0';
  assert.ok(auditTheme(YAML.stringify(workflow)).some((error) => error.startsWith('audit status propagation failed')));
});

test('[mutation] theme最終status stepの削除を検出する', () => {
  const workflow = parse(themeSource);
  workflow.jobs.theme.steps = workflow.jobs.theme.steps.filter(
    (step) => step.name !== 'Propagate audit failures',
  );
  assert.ok(auditTheme(YAML.stringify(workflow)).includes('always live audit propagation step is missing'));
});

test('[mutation] active audit failure propagation cannot be skipped after an earlier failure', () => {
  const workflow = parse(themeSource);
  workflow.jobs.theme.steps.find(step => step.name === 'Propagate audit failures').if = "success() && steps.plan.outputs.run == 'true'";
  assert.ok(auditTheme(YAML.stringify(workflow)).includes('always live audit propagation step is missing'));
});
for (const kind of ['summary', 'runtime']) {
  test(`[mutation] ${kind} failure cannot be removed from final status`, () => {
    const workflow = parse(themeSource);
    const final = workflow.jobs.theme.steps.find(step => step.name === 'Propagate audit failures');
    final.run = final.run.replace(` && test "$${kind.toUpperCase()}_CODE" = 0`, '');
    assert.ok(auditTheme(YAML.stringify(workflow)).some(error => error.startsWith('audit status propagation failed')));
  });
}
