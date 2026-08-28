'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  compareToBase,
  compareToRuntime,
  summarizeRows,
  validateBaseline,
} = require('../check-money-unit-audit.cjs');

const entry = (code, count) => ({
  code,
  count,
  owner: 'data-ingester',
  reason: 'fixture debt',
  expiresAt: '2099-01-01',
});
const baseline = { version: 1, unknown: [entry('meta-missing', 2)] };

test('money auditはmismatch 0・unknown baseline以下を受理する', () => {
  const summary = summarizeRows([
    { verdict: { kind: 'ok' } },
    { verdict: { kind: 'skip', reason: 'meta-missing' } },
  ]);
  assert.deepEqual(summary, { mismatches: 0, unknown: { 'meta-missing': 1 } });
  assert.deepEqual(validateBaseline(baseline, new Date('2026-08-27T00:00:00Z')), []);
  assert.deepEqual(compareToRuntime(summary, baseline), []);
});

test('[mutation] valueScale不一致は常にredになる', () => {
  const summary = summarizeRows([{ verdict: { kind: 'mismatch' } }]);
  assert.ok(compareToRuntime(summary, baseline).some((error) => error.includes('mismatch')));
});

test('[mutation] unknown reason追加と件数増加を拒否する', () => {
  assert.deepEqual(compareToRuntime({ mismatches: 0, unknown: { new_reason: 1 } }, baseline), [
    'new unknown reason: new_reason=1',
  ]);
  assert.deepEqual(compareToRuntime({ mismatches: 0, unknown: { 'meta-missing': 3 } }, baseline), [
    'unknown baseline exceeded: meta-missing=3>2',
  ]);
});

test('[mutation] merge-baseからbaselineを増加・追加できない', () => {
  assert.deepEqual(compareToBase({ version: 1, unknown: [entry('meta-missing', 3)] }, baseline), [
    'baseline increase is forbidden: meta-missing=3>2',
  ]);
  assert.deepEqual(
    compareToBase({ version: 1, unknown: [...baseline.unknown, entry('new', 1)] }, baseline),
    ['baseline addition is forbidden: new'],
  );
});

test('owner・reason・期限を欠くbaselineと期限切れを拒否する', () => {
  const invalid = {
    version: 1,
    unknown: [{ code: 'x', count: 1, owner: '', reason: '', expiresAt: '2020-01-01' }],
  };
  const errors = validateBaseline(invalid, new Date('2026-08-27T00:00:00Z'));
  assert.equal(errors.length, 3);
});
