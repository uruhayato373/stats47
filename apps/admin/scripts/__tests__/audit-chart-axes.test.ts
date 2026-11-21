import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reproducesValues } from '../audit-chart-axes';

test('tells a rounding difference from a changed value', () => {
  const observed = new Map([['01', 543.25], ['02', 1277.3]]);
  assert.equal(reproducesValues([{ code: '01', value: 543.3 }, { code: '02', value: 1277.3 }], observed), true);
  assert.equal(reproducesValues([{ code: '01', value: 543.3 }, { code: '02', value: 66733 }], observed), false);
  assert.equal(reproducesValues([{ code: '01', value: 543.3 }, { code: '03', value: 1 }], observed), false);
});
