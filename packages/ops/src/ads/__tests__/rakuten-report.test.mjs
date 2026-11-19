import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRecords, targetMonths } from '../rakuten-report.mjs';

test('当月と前月を JST で決め、1 月は前年 12 月を含める', () => {
  assert.deepEqual(targetMonths(new Date('2026-09-30T15:30:00Z')), ['2026-09', '2026-10']); // JST 10/1 00:30
  assert.deepEqual(targetMonths(new Date('2027-01-05T00:00:00Z')), ['2026-12', '2027-01']);
});

const overview = (clicks, sales, amount, rewards) => ({ total: 0, rows: [], totals: { clicks, sales, amount, rewards } });
const reward = (rows) => ({ total: 0, rows, totals: {} });

test('発生は月の totals、確定はその月に確定した額 (ポイント + キャッシュ + 振込)', () => {
  const recs = buildRecords({
    months: ['2026-09', '2026-10'],
    overviews: [overview(30, 2, 5000, 150), overview(0, 0, 0, 0)],
    rewards: [reward([{ yearmonth: '2026-09', points: 100, cash: 20, transfer: 0 }, { yearmonth: '2026-10', points: 0, cash: 0, transfer: 0 }])],
    observedAt: 'T',
  });
  assert.deepEqual(recs[0], { month: '2026-09', clicks: 30, orders: 2, amountYen: 5000, estimatedYen: 150, confirmedYen: 120, observedAt: 'T', source: 'collector:rakuten-affiliate-api' });
});

// 意図: 応答の形が変わったときに 0 円の記録を作らない (止めて report_* を返す)
test('形が違う応答・確定月の欠落は記録を作らずに止める', () => {
  const ok = reward([{ yearmonth: '2026-10', points: 0, cash: 0, transfer: 0 }]);
  assert.throws(() => buildRecords({ months: ['2026-10'], overviews: [{ totals: { clicks: 1 } }], rewards: [ok], observedAt: 'T' }), /report_schema_changed: monthly/);
  assert.throws(() => buildRecords({ months: ['2026-10'], overviews: [overview(0, 0, 0, 0)], rewards: [{ error: 'x' }], observedAt: 'T' }), /report_schema_changed: reward/);
  assert.throws(() => buildRecords({ months: ['2026-11'], overviews: [overview(0, 0, 0, 0)], rewards: [ok], observedAt: 'T' }), /reward_month_missing/);
});
