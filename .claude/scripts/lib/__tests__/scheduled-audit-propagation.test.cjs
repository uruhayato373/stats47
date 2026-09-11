'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '../../../..');
const PROVENANCE = path.join(ROOT, '.github/workflows/provenance-audit-weekly.yml');
const THEME = path.join(ROOT, '.github/workflows/theme-chart-audit-weekly.yml');

const PROVENANCE_COMMANDS = [
  'npm run validate:config',
  'npm run validate:catalog',
  'npm run validate:area-databook',
  'npm run validate:prefecture-statistics',
  'npm run validate:open-data-catalog',
  'npm run check:prefecture-statistics-links',
  'npm run check:open-data-links',
  'node .claude/scripts/lib/check-japan-zue-evidence-inventory.mjs',
];

function parse(source) {
  return YAML.parse(source);
}

function stepsOf(workflow) {
  return workflow?.jobs?.audit?.steps ?? [];
}

function auditProvenance(source) {
  const steps = stepsOf(parse(source));
  const check = steps.find((step) => step.id === 'check');
  const final = steps.find((step) => step.name?.includes('Propagate validator status'));
  const errors = [];
  if (!check || typeof check.run !== 'string') return ['validator collector is missing'];
  for (const command of PROVENANCE_COMMANDS) {
    const commandLine = check.run.split('\n').find((line) => line.includes(command));
    if (!commandLine) errors.push(`${command} is not executed`);
    else if (/\|\|\s*true/.test(commandLine)) errors.push(`${command} is fail-open`);
  }
  const pipeCaptures = [...check.run.matchAll(/="\$\{PIPESTATUS\[0\]\}"/g)].length;
  if (pipeCaptures !== PROVENANCE_COMMANDS.length) {
    errors.push(`validator exit capture mismatch: ${pipeCaptures}/${PROVENANCE_COMMANDS.length}`);
  }
  if (!check.run.includes('echo "error_count=$ERROR_COUNT" >> "$GITHUB_OUTPUT"')) {
    errors.push('aggregate error_count output is missing');
  }
  if (!final || final.if !== 'always()' || typeof final.run !== 'string') {
    errors.push('always final propagation step is missing');
  } else {
    if (!final.run.includes('steps.check.outcome')) errors.push('collector outcome is not propagated');
    if (!final.run.includes('steps.check.outputs.error_count')) {
      errors.push('validator error_count is not propagated');
    }
  }
  return errors;
}

function auditTheme(source) {
  const steps = stepsOf(parse(source));
  const check = steps.find((step) => step.id === 'check');
  const final = steps.find((step) => step.name === 'Propagate audit failures');
  const errors = [];
  for (const kind of ['live', 'quality']) {
    if (!check?.run?.includes(`${kind}_code=\${PIPESTATUS[0]}`)) {
      errors.push(`${kind} audit exit code is not captured`);
    }
  }
  if (!check?.run?.includes('alert_code=$?')) {
    errors.push('alert exit code is not captured');
  }
  if (!final || final.if !== 'always()' || typeof final.run !== 'string') {
    errors.push('always live audit propagation step is missing');
  } else {
    const bindings = {
      CHECK_OUTCOME: 'steps.check.outcome',
      LIVE_CODE: 'steps.check.outputs.live_code',
      QUALITY_CODE: 'steps.check.outputs.quality_code',
      ALERT_CODE: 'steps.check.outputs.alert_code',
    };
    for (const [key, expression] of Object.entries(bindings)) {
      if (final.env?.[key] !== '${{ ' + expression + ' }}') errors.push(`${key} is not propagated`);
    }
    const success = { CHECK_OUTCOME: 'success', LIVE_CODE: '0', QUALITY_CODE: '0', ALERT_CODE: '0' };
    const cases = [success, ...Object.keys(success).map((key) => ({ ...success, [key]: key === 'CHECK_OUTCOME' ? 'failure' : '1' }))];
    for (const [index, env] of cases.entries()) {
      const result = spawnSync('bash', ['-c', final.run], { env: { ...process.env, ...env }, timeout: 2000 });
      if (result.error || (result.status === 0) !== (index === 0)) errors.push(`audit status propagation failed: ${JSON.stringify(env)}`);
    }
  }
  return errors;
}

const provenanceSource = fs.readFileSync(PROVENANCE, 'utf8');
const themeSource = fs.readFileSync(THEME, 'utf8');

test('実workflowは全validatorとlive監査の失敗をIssue更新後のjob statusへ伝播する', () => {
  assert.deepEqual(auditProvenance(provenanceSource), []);
  assert.deepEqual(auditTheme(themeSource), []);
});

test('[mutation] provenance validatorの|| true復活を検出する', () => {
  const mutated = provenanceSource.replace(
    'npm run validate:catalog --workspace=@stats47/data-configs 2>&1 | tee /tmp/prov-catalog.log',
    'npm run validate:catalog --workspace=@stats47/data-configs 2>&1 | tee /tmp/prov-catalog.log || true',
  );
  assert.ok(auditProvenance(mutated).includes('npm run validate:catalog is fail-open'));
});

test('[mutation] validator exit codeの未集約を検出する', () => {
  const mutated = provenanceSource.replace('CATALOG_RC="${PIPESTATUS[0]}"', 'CATALOG_RC=0');
  assert.ok(auditProvenance(mutated).some((error) => error.includes('exit capture mismatch')));
});

test('[mutation] provenance最終status stepの削除を検出する', () => {
  const workflow = parse(provenanceSource);
  workflow.jobs.audit.steps = workflow.jobs.audit.steps.filter(
    (step) => !step.name?.includes('Propagate validator status'),
  );
  assert.ok(auditProvenance(YAML.stringify(workflow)).includes('always final propagation step is missing'));
});

for (const kind of ['live', 'quality']) {
  test(`[mutation] theme ${kind}監査exit codeの固定0化を検出する`, () => {
    const mutated = themeSource.replace(`${kind}_code=\${PIPESTATUS[0]}`, `${kind}_code=0`);
    assert.notEqual(mutated, themeSource);
    assert.ok(auditTheme(mutated).includes(`${kind} audit exit code is not captured`));
  });
}

test('[mutation] theme最終statusの無条件成功を検出する', () => {
  const workflow = parse(themeSource);
  workflow.jobs.audit.steps.find((step) => step.name === 'Propagate audit failures').run = 'exit 0';
  assert.ok(auditTheme(YAML.stringify(workflow)).some((error) => error.startsWith('audit status propagation failed')));
});

test('[mutation] theme最終status stepの削除を検出する', () => {
  const workflow = parse(themeSource);
  workflow.jobs.audit.steps = workflow.jobs.audit.steps.filter(
    (step) => step.name !== 'Propagate audit failures',
  );
  assert.ok(auditTheme(YAML.stringify(workflow)).includes('always live audit propagation step is missing'));
});
