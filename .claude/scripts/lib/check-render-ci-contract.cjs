#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const childProcess = require('node:child_process');
const YAML = require('yaml');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '../../..');
const COMMAND = 'npm run test:run --workspace=@stats47/visualization';
const GOLDEN_PREFIX = 'packages/visualization/src/shared/__tests__/__golden__/';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function auditGoldenAcceptances(entries, changedGoldens, beforeByPath, afterByPath) {
  const errors = [];
  const byPath = new Map();
  for (const entry of entries) {
    if (!entry?.path || byPath.has(entry.path)) {
      errors.push(`golden acceptance: duplicate or missing path ${entry?.path || '<missing>'}`);
      continue;
    }
    byPath.set(entry.path, entry);
  }
  for (const goldenPath of changedGoldens) {
    const entry = byPath.get(goldenPath);
    if (!entry) {
      errors.push(`golden acceptance: unexplained update ${goldenPath}`);
      continue;
    }
    if (!entry.cause || !Array.isArray(entry.causeRefs) || entry.causeRefs.length === 0) {
      errors.push(`golden acceptance: cause evidence missing ${goldenPath}`);
    }
    if (entry.beforeSha256 !== beforeByPath.get(goldenPath)) {
      errors.push(`golden acceptance: before hash mismatch ${goldenPath}`);
    }
    if (entry.afterSha256 !== afterByPath.get(goldenPath)) {
      errors.push(`golden acceptance: after hash mismatch ${goldenPath}`);
    }
  }
  return errors;
}

function collectGoldenChanges(baseRef) {
  const changed = childProcess.execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=AM', baseRef, '--', GOLDEN_PREFIX],
    { cwd: ROOT, encoding: 'utf8' },
  ).trim().split('\n').filter((value) => value.endsWith('.png'));
  const before = new Map();
  const after = new Map();
  for (const goldenPath of changed) {
    const previous = childProcess.execFileSync('git', ['show', `${baseRef}:${goldenPath}`], {
      cwd: ROOT,
      encoding: 'buffer',
    });
    before.set(goldenPath, sha256(previous));
    after.set(goldenPath, sha256(fs.readFileSync(path.join(ROOT, goldenPath))));
  }
  return { changed, before, after };
}

function requiredJobs(workflow) {
  const needs = workflow?.jobs?.['quality-check']?.needs;
  return new Set(Array.isArray(needs) ? needs : typeof needs === 'string' ? [needs] : []);
}

function auditRenderJob(job, label) {
  const errors = [];
  if (!job || !Array.isArray(job.steps)) return [`${label}: render job is missing`];
  if (!Number.isFinite(job['timeout-minutes']) || job['timeout-minutes'] > 10) {
    errors.push(`${label}: timeout is missing or too large`);
  }
  const render = job.steps.find((step) => step.run === COMMAND);
  if (!render) errors.push(`${label}: render command is missing`);
  else {
    if (render['continue-on-error'] === true) errors.push(`${label}: render command is fail-open`);
    if (String(render.env?.RUN_RENDER_TESTS) !== '1') errors.push(`${label}: RUN_RENDER_TESTS is not enabled`);
    if (render.env?.UPDATE_GOLDEN) errors.push(`${label}: CI must not update goldens`);
  }
  const artifact = job.steps.find((step) => String(step.uses || '').startsWith('actions/upload-artifact@'));
  if (!artifact || artifact.if !== 'failure()' || artifact.with?.['if-no-files-found'] !== 'ignore') {
    errors.push(`${label}: failure artifact step is invalid`);
  }
  return errors;
}

function auditContracts(prSource, scheduledSource) {
  const pr = YAML.parse(prSource);
  const scheduled = YAML.parse(scheduledSource);
  const errors = [
    ...auditRenderJob(pr?.jobs?.['visualization-render'], 'pr'),
    ...auditRenderJob(scheduled?.jobs?.render, 'scheduled'),
  ];
  if (!requiredJobs(pr).has('visualization-render')) {
    errors.push('pr: visualization-render is not required');
  }
  if (!scheduled?.on?.schedule) errors.push('scheduled: schedule trigger is missing');
  if (!scheduled?.concurrency || scheduled.concurrency['cancel-in-progress'] !== false) {
    errors.push('scheduled: concurrency contract is missing');
  }
  return errors;
}

function main() {
  const pr = fs.readFileSync(path.join(ROOT, '.github/workflows/pr-quality-check.yml'), 'utf8');
  const scheduled = fs.readFileSync(
    path.join(ROOT, '.github/workflows/visualization-render-weekly.yml'),
    'utf8',
  );
  const acceptance = JSON.parse(
    fs.readFileSync(path.join(ROOT, '.claude/config/render-golden-acceptance.json'), 'utf8'),
  );
  const baseFlag = process.argv.indexOf('--base');
  const baseRef = baseFlag >= 0 ? process.argv[baseFlag + 1] : process.env.GITHUB_ACTIONS ? 'HEAD^1' : 'HEAD';
  let goldenErrors = [];
  try {
    const changes = collectGoldenChanges(baseRef);
    goldenErrors = auditGoldenAcceptances(
      acceptance.entries || [],
      changes.changed,
      changes.before,
      changes.after,
    );
  } catch (error) {
    goldenErrors = [`golden acceptance: cannot compare ${baseRef}: ${error.message}`];
  }
  const errors = [...auditContracts(pr, scheduled), ...goldenErrors];
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`✗ ${error}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('render CI contract: PR required + weekly scheduled\n');
}

if (require.main === module) main();

module.exports = { auditContracts, auditGoldenAcceptances };
