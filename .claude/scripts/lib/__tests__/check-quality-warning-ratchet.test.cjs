'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  auditBaselineGrowth,
  auditWarningBaseline,
  collectWarningCountsFromOutput,
} = require('../check-quality-warning-ratchet.cjs');

const future = '2099-01-01';
const entry = (source, code, count) => ({
  source,
  code,
  count,
  owner: 'owner',
  reason: 'reason',
  expiresAt: future,
});

test('validator出力を実finding件数へ正規化する', () => {
  assert.deepEqual(
    [...collectWarningCountsFromOutput('theme-catalog', 'warn 内訳: no-selection=120 dup-key-global=2')],
    [['theme-catalog:no-selection', 120], ['theme-catalog:dup-key-global', 2]],
  );
  assert.equal(
    collectWarningCountsFromOutput('polarity', '[polarity-unassigned] 極性 未割当 2244 件 / 収載 54 件').get('polarity:polarity-unassigned'),
    2244,
  );
  const config = collectWarningCountsFromOutput(
    'metric-config',
    'warn 内訳: unit-vocab=1 placeholder-source=1\n[unit-vocab] 解釈できない unit 39 種 / 46 件',
  );
  assert.equal(config.get('metric-config:unit-vocab'), 46);
  assert.equal(config.get('metric-config:placeholder-source'), 1);
});

test('現行warningがbaseline以下ならgreen', () => {
  const entries = [entry('theme-catalog', 'no-selection', 120)];
  const actual = new Map([['theme-catalog:no-selection', 119]]);
  assert.deepEqual(auditWarningBaseline(entries, actual), []);
});

test('[mutation] 新codeと件数増加を拒否する', () => {
  const entries = [entry('theme-catalog', 'no-selection', 120)];
  const actual = new Map([
    ['theme-catalog:no-selection', 121],
    ['theme-catalog:new-code', 1],
  ]);
  const errors = auditWarningBaseline(entries, actual);
  assert.ok(errors.some((error) => error.includes('warning increased')));
  assert.ok(errors.some((error) => error.includes('new warning code')));
});

test('[mutation] owner欠落と期限切れを拒否する', () => {
  const entries = [{ ...entry('theme-catalog', 'no-selection', 120), owner: '', expiresAt: '2020-01-01' }];
  const errors = auditWarningBaseline(entries, new Map([['theme-catalog:no-selection', 120]]));
  assert.ok(errors.some((error) => error.includes('owner and reason')));
  assert.ok(errors.some((error) => error.includes('expired exception')));
});

test('[mutation] baseline引上げとcode追加を拒否する', () => {
  const previous = [entry('theme-catalog', 'no-selection', 120)];
  const current = [entry('theme-catalog', 'no-selection', 121), entry('theme-catalog', 'new-code', 1)];
  const errors = auditBaselineGrowth(current, previous);
  assert.ok(errors.some((error) => error.includes('baseline increased')));
  assert.ok(errors.some((error) => error.includes('baseline code added')));
});
