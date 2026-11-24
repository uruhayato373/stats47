const assert = require('node:assert/strict');
const test = require('node:test');

const { isoWeekStart } = require('../check-x-post-budget.cjs');

test('JSTの日付を含む週の月曜日を返す', () => {
  assert.equal(isoWeekStart('2026-09-07'), '2026-09-07');
  assert.equal(isoWeekStart('2026-09-10'), '2026-09-07');
  assert.equal(isoWeekStart('2026-09-13'), '2026-09-07');
  assert.equal(isoWeekStart('2026-09-14'), '2026-09-14');
});
