import assert from 'node:assert/strict';
import { test } from 'node:test';
import { monthlyLedgerErrors, summarizeMonthlyTables } from '../../estat/build-monthly-ledger.mjs';

const row = (over) => ({ statsDataId: '0001', statCode: '100', statName: '家計調査', govOrg: '総務省', title: '品目', cycle: '月次', updatedDate: '2026-01-01', collectAreas: ['0'], removedAt: null, ...over });

test('月次の表だけを調査ごとに数え、県の表も分ける', () => {
  const [survey, ...rest] = summarizeMonthlyTables([
    row(), row({ statsDataId: '0002', collectAreas: ['2'], updatedDate: '2026-02-01' }),
    row({ statsDataId: '0003', cycle: '年次' }), row({ statsDataId: '0004', removedAt: '2026-01-01' }),
  ], new Set(['0002']));
  assert.equal(rest.length, 0);
  assert.equal(survey.tables, 2);
  assert.equal(survey.prefectureTables, 1);
  assert.equal(survey.latestUpdate, '2026-02-01');
  assert.deepEqual(survey.pinned.map((t) => t.statsDataId), ['0002']);
});

test('全調査に判断があり、判断が指す表は実在する', () => {
  const ledger = { surveys: [{ statCode: '100', statName: 'a', pinned: [{ statsDataId: '0001' }] }, { statCode: '200', statName: 'b', pinned: [] }] };
  assert.deepEqual(monthlyLedgerErrors(ledger, { decisions: [{ statCode: '100', decision: 'use', tables: ['0001'] }, { statCode: '200', decision: 'exclude' }] }), []);
  assert.match(monthlyLedgerErrors(ledger, { decisions: [{ statCode: '100', decision: 'use', tables: ['0001'] }] })[0], /判断の無い調査/);
  assert.match(monthlyLedgerErrors(ledger, { decisions: [{ statCode: '100', decision: 'use', tables: ['9999'] }, { statCode: '200', decision: 'exclude' }] })[0], /月次の表に無い/);
  assert.match(monthlyLedgerErrors(ledger, { decisions: [{ statCode: '100', decision: 'use' }, { statCode: '200', decision: 'exclude' }] })[0], /表の指定が無い/);
  assert.match(monthlyLedgerErrors(ledger, { decisions: [{ statCode: '100', decision: 'exclude' }, { statCode: '200', decision: 'exclude' }, { statCode: '300', decision: 'hold' }] })[0], /月次の表の無い調査/);
});
