import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { tailLines } from '../tail-lines.mjs';

const stack = [
  'node:internal/modules/cjs/loader:1100',
  "Error [ERR_REQUIRE_CYCLE_MODULE]: Cannot require() ES Module config/datasets.mjs in a cycle.",
  '    at Module._compile (node:internal/modules/cjs/loader:1',
  'Node.js v20.19.0'].join('\n');

test('失敗の message は末尾 1 行でなく例外の本体を含み、JSON は 1 行のまま', () => {
  const message = tailLines(stack);
  assert.match(message, /ERR_REQUIRE_CYCLE_MODULE/);
  assert.match(message, /Node\.js v20\.19\.0$/);
  const record = JSON.stringify({ source: 'gsc', status: 'failed', step: 'bootstrap', message });
  assert.equal(record.includes('\n'), false, '出力契約: 1 行の JSON');
  assert.deepEqual(JSON.parse(record).message, message);
});

test('長い出力は末尾 20 行・4000 文字までに切り、空は空のまま', () => {
  const long = Array.from({ length: 100 }, (_, n) => `line ${n}`).join('\n');
  assert.equal(tailLines(long).split('\n').length, 20);
  assert.equal(tailLines(long).split('\n')[0], 'line 80');
  assert.equal(tailLines('x'.repeat(9000)).length, 4000);
  assert.equal(tailLines(undefined), '');
});

test('collect-local は bootstrap と collect の失敗に stderr の末尾を残す', () => {
  const runner = readFileSync(new URL('../collect-local.mjs', import.meta.url), 'utf8');
  assert.match(runner, /step: 'bootstrap'.*message: tailLines\(boot\.stderr\)/);
  assert.match(runner, /step: 'collect'.*message: tailLines\(collected\.stderr\)/);
  assert.doesNotMatch(runner, /message: lastLine\(boot\.stderr\)/);
});
