'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '../../../..');
const PROVENANCE = path.join(ROOT, '.github/workflows/provenance-audit-weekly.yml');
const THEME = path.join(ROOT, '.github/workflows/theme-chart-audit-weekly.yml');

const PROVENANCE_COMMANDS = [
  'validate:config',
  'validate:catalog',
  'validate:area-databook',
  'validate:prefecture-statistics',
  'validate:open-data-catalog',
  'check:prefecture-statistics-links',
  'check:open-data-links',
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
    const commandLine = check.run.split('\n').find((line) => line.includes(`npm run ${command}`));
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
  const final = steps.find((step) => step.name?.includes('Propagate live audit status'));
  const errors = [];
  if (!check?.run?.includes('exit_code=${PIPESTATUS[0]}')) {
    errors.push('live audit exit code is not captured');
  }
  if (!final || final.if !== 'always()' || typeof final.run !== 'string') {
    errors.push('always live audit propagation step is missing');
  } else {
    if (!final.run.includes('steps.check.outcome')) errors.push('live collector outcome is not propagated');
    if (!final.run.includes('steps.check.outputs.exit_code')) {
      errors.push('live audit exit code is not propagated');
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
  assert.ok(auditProvenance(mutated).includes('validate:catalog is fail-open'));
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

test('[mutation] theme監査exit codeの固定0化を検出する', () => {
  const mutated = themeSource.replace('exit_code=${PIPESTATUS[0]}', 'exit_code=0');
  assert.ok(auditTheme(mutated).includes('live audit exit code is not captured'));
});

test('[mutation] theme最終status stepの削除を検出する', () => {
  const workflow = parse(themeSource);
  workflow.jobs.audit.steps = workflow.jobs.audit.steps.filter(
    (step) => !step.name?.includes('Propagate live audit status'),
  );
  assert.ok(auditTheme(YAML.stringify(workflow)).includes('always live audit propagation step is missing'));
});
