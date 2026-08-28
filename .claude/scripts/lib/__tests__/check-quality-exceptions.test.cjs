'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  auditExceptionRegistry,
  auditRegistryGrowth,
  inventoryKey,
} = require('../check-quality-exceptions.cjs');

const sample = {
  type: 'test-skip',
  path: 'apps/web/example.test.ts',
  count: 1,
  owner: 'site-ux-manager',
  reason: 'external fixture unavailable',
  expiresAt: '2099-01-01',
};

test('owner付き現行例外を受理する', () => {
  assert.deepEqual(auditExceptionRegistry([sample], new Map([[inventoryKey(sample), 1]])), []);
});

test('[mutation] 未登録skipと件数増加を拒否する', () => {
  const unknown = { type: 'test-skip', path: 'apps/web/new.test.ts' };
  const errors = auditExceptionRegistry(
    [sample],
    new Map([[inventoryKey(sample), 2], [inventoryKey(unknown), 1]]),
  );
  assert.ok(errors.some((error) => error.includes('count increased')));
  assert.ok(errors.some((error) => error.includes('unregistered')));
});

test('[mutation] owner欠落と期限切れを拒否する', () => {
  const invalid = { ...sample, owner: '', expiresAt: '2020-01-01' };
  const errors = auditExceptionRegistry([invalid], new Map([[inventoryKey(invalid), 1]]));
  assert.ok(errors.some((error) => error.includes('owner and reason')));
  assert.ok(errors.some((error) => error.includes('expired exception')));
});

test('[mutation] baseline引上げと例外追加を拒否する', () => {
  const added = { ...sample, path: 'apps/web/new.test.ts' };
  const errors = auditRegistryGrowth([{ ...sample, count: 2 }, added], [sample]);
  assert.ok(errors.some((error) => error.includes('baseline increased')));
  assert.ok(errors.some((error) => error.includes('exception added')));
});
