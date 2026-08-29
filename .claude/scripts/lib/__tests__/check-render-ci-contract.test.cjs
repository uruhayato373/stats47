'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { auditContracts, auditGoldenAcceptances } = require('../check-render-ci-contract.cjs');

const ROOT = path.resolve(__dirname, '../../../..');
const pr = fs.readFileSync(path.join(ROOT, '.github/workflows/pr-quality-check.yml'), 'utf8');
const scheduled = fs.readFileSync(
  path.join(ROOT, '.github/workflows/visualization-render-weekly.yml'),
  'utf8',
);

test('render golden 9 filesをPR requiredと週次scheduleの両方へ配線する', () => {
  assert.deepEqual(auditContracts(pr, scheduled), []);
});

test('[mutation] PR jobのrequired切断を検出する', () => {
  const mutated = pr.replace(', visualization-render, build', ', build');
  assert.ok(auditContracts(mutated, scheduled).includes('pr: visualization-render is not required'));
});

test('[mutation] render commandのsoft-fail化を検出する', () => {
  const mutated = pr.replace(
    'run: npm run test:run --workspace=@stats47/visualization\n        continue-on-error: false',
    'run: npm run test:run --workspace=@stats47/visualization\n        continue-on-error: true',
  );
  assert.ok(auditContracts(mutated, scheduled).includes('pr: render command is fail-open'));
});

test('[mutation] opt-in envの削除を検出する', () => {
  const mutated = scheduled.replace('RUN_RENDER_TESTS: "1"', 'RUN_RENDER_TESTS: "0"');
  assert.ok(auditContracts(pr, mutated).includes('scheduled: RUN_RENDER_TESTS is not enabled'));
});

test('[mutation] CIでgolden更新を有効化すると拒否する', () => {
  const mutated = scheduled.replace(
    'RUN_RENDER_TESTS: "1"',
    'RUN_RENDER_TESTS: "1"\n          UPDATE_GOLDEN: "true"',
  );
  assert.ok(auditContracts(pr, mutated).includes('scheduled: CI must not update goldens'));
});

test('golden更新は旧新hashと原因commitが一致すると受理する', () => {
  const golden = 'packages/visualization/src/shared/__tests__/__golden__/chart.png';
  const entries = [{
    path: golden,
    beforeSha256: 'before',
    afterSha256: 'after',
    cause: 'intentional chart layout change',
    causeRefs: ['abcdef123'],
  }];
  assert.deepEqual(
    auditGoldenAcceptances(entries, [golden], new Map([[golden, 'before']]), new Map([[golden, 'after']])),
    [],
  );
});

test('[mutation] 原因説明のないgolden更新を拒否する', () => {
  const golden = 'packages/visualization/src/shared/__tests__/__golden__/chart.png';
  const errors = auditGoldenAcceptances([], [golden], new Map(), new Map());
  assert.ok(errors.includes(`golden acceptance: unexplained update ${golden}`));
});

test('[mutation] 一括accept後の不一致hashを拒否する', () => {
  const golden = 'packages/visualization/src/shared/__tests__/__golden__/chart.png';
  const entries = [{
    path: golden,
    beforeSha256: 'wrong-before',
    afterSha256: 'wrong-after',
    cause: 'intentional chart layout change',
    causeRefs: ['abcdef123'],
  }];
  const errors = auditGoldenAcceptances(
    entries,
    [golden],
    new Map([[golden, 'before']]),
    new Map([[golden, 'after']]),
  );
  assert.ok(errors.includes(`golden acceptance: before hash mismatch ${golden}`));
  assert.ok(errors.includes(`golden acceptance: after hash mismatch ${golden}`));
});
