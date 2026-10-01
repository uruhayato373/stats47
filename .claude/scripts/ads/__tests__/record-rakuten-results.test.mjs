import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRecord, upsertRecord } from '../record-rakuten-results.mjs';

const NOW = new Date('2026-10-05T00:00:00Z');

test('引数を検査し、確定額を省略した月は null (未確定) で記録する', () => {
  const r = parseRecord(['--month', '2026-10', '--orders', '3', '--estimated-yen', '420'], NOW);
  assert.deepEqual(r, { month: '2026-10', orders: 3, estimatedYen: 420, confirmedYen: null,
    observedAt: '2026-10-05T00:00:00.000Z', source: 'manual:rakuten-affiliate-dashboard' });
  assert.throws(() => parseRecord(['--month', '2026-13', '--orders', '1', '--estimated-yen', '1'], NOW), /YYYY-MM/);
  assert.throws(() => parseRecord(['--month', '2026-10', '--estimated-yen', '1'], NOW), /--orders/);
  assert.throws(() => parseRecord(['--month', '2026-10', '--orders', '-1', '--estimated-yen', '1'], NOW), /整数/);
});

test('同じ月は上書きし、月の昇順に並べる', () => {
  const a = parseRecord(['--month', '2026-10', '--orders', '1', '--estimated-yen', '100'], NOW);
  const b = parseRecord(['--month', '2026-09', '--orders', '2', '--estimated-yen', '200', '--confirmed-yen', '150'], NOW);
  const c = parseRecord(['--month', '2026-10', '--orders', '4', '--estimated-yen', '500'], NOW);
  const out = upsertRecord(upsertRecord(upsertRecord(null, a), b), c);
  assert.deepEqual(out.records.map((r) => [r.month, r.orders]), [['2026-09', 2], ['2026-10', 4]]);
});
